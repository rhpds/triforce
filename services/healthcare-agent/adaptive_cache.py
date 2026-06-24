"""Adaptive classification cache — learns from LLM results over time.

Starts at 100% LLM classification. After seeing a document's text hash,
returns the cached classification deterministically. LLM only handles
novel documents. The system gets cheaper per record over time.
"""

import hashlib
import logging
import os
from typing import Dict, Optional

import db

logger = logging.getLogger("healthcare.adaptive")

ADAPTIVE_ENABLED = os.environ.get("ADAPTIVE_CLASSIFICATION", "true").lower() == "true"

_cache: Dict[str, dict] = {}
_stats = {"total_lookups": 0, "cache_hits": 0, "cache_misses": 0}


def compute_text_hash(text: str) -> str:
    return hashlib.sha256(text[:5000].encode("utf-8")).hexdigest()


async def init_cache():
    if not db._pool:
        logger.info("No DB pool — adaptive cache is memory-only")
        return
    try:
        rows = await db._pool.fetch(
            "SELECT text_hash, classification, confidence, hit_count FROM classification_cache"
        )
        for row in rows:
            _cache[row["text_hash"]] = {
                "classification": row["classification"],
                "confidence": row["confidence"],
                "hit_count": row["hit_count"],
            }
        logger.info("Adaptive cache loaded %d entries from DB", len(_cache))
    except Exception as e:
        logger.warning("Failed to load adaptive cache: %s", e)


def lookup(text: str) -> Optional[dict]:
    if not ADAPTIVE_ENABLED:
        return None
    _stats["total_lookups"] += 1
    text_hash = compute_text_hash(text)
    entry = _cache.get(text_hash)
    if entry:
        _stats["cache_hits"] += 1
        entry["hit_count"] += 1
        return {"classification": entry["classification"], "confidence": entry["confidence"]}
    _stats["cache_misses"] += 1
    return None


async def store(text: str, classification: str):
    text_hash = compute_text_hash(text)
    _cache[text_hash] = {
        "classification": classification,
        "confidence": 1.0,
        "hit_count": 0,
    }
    if not db._pool:
        return
    try:
        await db._pool.execute(
            """INSERT INTO classification_cache (text_hash, classification)
               VALUES ($1, $2)
               ON CONFLICT (text_hash) DO UPDATE
               SET hit_count = classification_cache.hit_count + 1,
                   updated_at = now()""",
            text_hash, classification,
        )
    except Exception as e:
        logger.warning("Failed to persist cache entry: %s", e)


async def reset():
    _cache.clear()
    _stats["total_lookups"] = 0
    _stats["cache_hits"] = 0
    _stats["cache_misses"] = 0
    if db._pool:
        try:
            await db._pool.execute("DELETE FROM classification_cache")
        except Exception as e:
            logger.warning("Failed to clear DB cache: %s", e)
    logger.info("Adaptive cache reset")


def get_stats() -> dict:
    total = max(_stats["total_lookups"], 1)
    return {
        "cache_size": len(_cache),
        "total_lookups": _stats["total_lookups"],
        "cache_hits": _stats["cache_hits"],
        "cache_misses": _stats["cache_misses"],
        "hit_rate": round(_stats["cache_hits"] / total, 4),
        "llm_reduction_pct": round((_stats["cache_hits"] / total) * 100, 1),
        "enabled": ADAPTIVE_ENABLED,
    }

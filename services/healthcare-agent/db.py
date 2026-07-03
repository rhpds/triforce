"""PostgreSQL async adapter for healthcare agent inference logging."""

import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger("healthcare.db")

_pool = None


async def init_pool():
    global _pool
    host = os.environ.get("POSTGRES_HOST", "")
    if not host:
        logger.info("No POSTGRES_HOST set — database logging disabled")
        return

    import asyncpg
    dsn = (
        f"postgresql://{os.environ.get('POSTGRES_USER', 'triforce')}"
        f":{os.environ.get('POSTGRES_PASSWORD', 'dev-only')}"
        f"@{host}:{os.environ.get('POSTGRES_PORT', '5432')}"
        f"/{os.environ.get('POSTGRES_DB', 'triforce')}"
    )
    try:
        _pool = await asyncpg.create_pool(dsn, min_size=1, max_size=5, command_timeout=10)
        logger.info("PostgreSQL pool initialized")
    except Exception as e:
        logger.warning("PostgreSQL connection failed: %s", e)


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def log_inference(agent_name: str, model: str, task_type: str,
                        latency_ms: int, accelerator: str = "cpu",
                        input_tokens: int = 0, output_tokens: int = 0,
                        kv_cache_hit: bool = False):
    if not _pool:
        return
    try:
        await _pool.execute(
            """INSERT INTO inference_log
               (agent_name, model, task_type, latency_ms, accelerator,
                input_tokens, output_tokens, kv_cache_hit)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
            agent_name, model, task_type, latency_ms, accelerator,
            input_tokens, output_tokens, kv_cache_hit,
        )
    except Exception as e:
        logger.warning("Failed to log inference: %s", e)


async def log_audit(agent_name: str, action: str, entity_type: str = None,
                    entity_id: str = None, details: dict = None):
    if not _pool:
        return
    import json
    try:
        await _pool.execute(
            """INSERT INTO audit_trail (agent_name, action, entity_type, entity_id, details)
               VALUES ($1, $2, $3, $4, $5)""",
            agent_name, action, entity_type, entity_id,
            json.dumps(details) if details else None,
        )
    except Exception as e:
        logger.warning("Failed to log audit: %s", e)


async def get_inference_stats(window_minutes: int = 5):
    if not _pool:
        return {}
    try:
        row = await _pool.fetchrow(
            """SELECT
                COUNT(*) as total_requests,
                COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms), 0) as median_latency_ms,
                COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) as p95_latency_ms,
                COUNT(*) FILTER (WHERE accelerator = 'cpu') as cpu_requests,
                COUNT(*) FILTER (WHERE accelerator = 'gpu') as gpu_requests,
                COUNT(*) FILTER (WHERE kv_cache_hit = true) as cache_hits,
                COALESCE(SUM(input_tokens), 0) as total_input_tokens,
                COALESCE(SUM(output_tokens), 0) as total_output_tokens
               FROM inference_log
               WHERE created_at > now() - interval '%s minutes'""" % window_minutes
        )
        last = await _pool.fetchrow(
            "SELECT latency_ms, model, task_type FROM inference_log ORDER BY created_at DESC LIMIT 1"
        )
        total = row["total_requests"]
        return {
            "total_requests": total,
            "avg_latency_ms": float(row["median_latency_ms"]),
            "p95_latency_ms": float(row["p95_latency_ms"]),
            "cpu_requests": row["cpu_requests"],
            "gpu_requests": row["gpu_requests"],
            "kv_cache_hit_rate": row["cache_hits"] / total if total > 0 else 0,
            "total_input_tokens": row["total_input_tokens"],
            "total_output_tokens": row["total_output_tokens"],
            "last_request_ms": last["latency_ms"] if last else 0,
            "last_request_model": last["model"] if last else "",
            "window_minutes": window_minutes,
        }
    except Exception as e:
        logger.warning("Failed to get stats: %s", e)
        return {}

"""Drug interaction data from NIH RxNav + clinical sources.

Provides real drug-drug interaction data for the MCP drug_interaction_check tool.
Falls back to curated database if RxNav API is unavailable.

Sources:
- NIH RxNav API: https://rxnav.nlm.nih.gov/InteractionAPIs.html
- FDA drug interaction tables
"""

import logging

import httpx

logger = logging.getLogger("healthcare.drug_data")

RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST"

# Curated interaction database — common drug pairs with clinical significance
KNOWN_INTERACTIONS_RAW = {
    ("warfarin", "aspirin"): {
        "severity": "major",
        "description": "Increased risk of bleeding. Both drugs affect hemostasis through different mechanisms. Monitor INR closely.",
    },
    ("warfarin", "metformin"): {
        "severity": "moderate",
        "description": "Metformin may enhance anticoagulant effect. Monitor INR when starting or stopping metformin.",
    },
    ("metformin", "lisinopril"): {
        "severity": "minor",
        "description": "ACE inhibitors may enhance hypoglycemic effect of metformin. Monitor blood glucose.",
    },
    ("metformin", "atorvastatin"): {
        "severity": "minor",
        "description": "No clinically significant interaction. Both commonly co-prescribed safely.",
    },
    ("aspirin", "lisinopril"): {
        "severity": "moderate",
        "description": "NSAIDs may reduce antihypertensive effect of ACE inhibitors. Monitor blood pressure.",
    },
    ("aspirin", "clopidogrel"): {
        "severity": "moderate",
        "description": "Dual antiplatelet therapy increases bleeding risk. Standard post-PCI regimen but monitor for bleeding.",
    },
    ("warfarin", "atorvastatin"): {
        "severity": "moderate",
        "description": "Statins may potentiate warfarin effect. Monitor INR when starting statin therapy.",
    },
    ("lisinopril", "amlodipine"): {
        "severity": "minor",
        "description": "Additive hypotensive effect. Often combined intentionally. Monitor blood pressure.",
    },
    ("metformin", "furosemide"): {
        "severity": "moderate",
        "description": "Furosemide may increase metformin levels. Monitor renal function and blood glucose.",
    },
    ("warfarin", "omeprazole"): {
        "severity": "moderate",
        "description": "PPIs may alter warfarin metabolism via CYP2C19. Monitor INR.",
    },
    ("gabapentin", "metformin"): {
        "severity": "minor",
        "description": "No significant interaction. Both may be co-prescribed safely.",
    },
}

# Normalize keys to sorted tuples for consistent lookup
KNOWN_INTERACTIONS = {tuple(sorted(k)): v for k, v in KNOWN_INTERACTIONS_RAW.items()}


async def check_interactions_rxnav(medications: list[str]) -> list[dict]:
    """Try to check interactions via NIH RxNav API."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            drug_list = "+".join(medications)
            resp = await client.get(
                f"{RXNAV_BASE}/interaction/list.json",
                params={"rxcuis": drug_list},
            )
            if resp.status_code == 200:
                data = resp.json()
                interactions = []
                for group in data.get("fullInteractionTypeGroup", []):
                    for itype in group.get("fullInteractionType", []):
                        for pair in itype.get("interactionPair", []):
                            interactions.append({
                                "drug_a": medications[0] if len(medications) > 0 else "unknown",
                                "drug_b": medications[1] if len(medications) > 1 else "unknown",
                                "severity": pair.get("severity", "unknown"),
                                "description": pair.get("description", ""),
                            })
                if interactions:
                    return interactions
    except Exception as e:
        logger.debug(f"RxNav API unavailable: {e}")
    return []


def check_interactions_local(medications: list[str]) -> list[dict]:
    """Check interactions against curated local database."""
    interactions = []
    meds_lower = [m.lower().strip() for m in medications]

    for i in range(len(meds_lower)):
        for j in range(i + 1, len(meds_lower)):
            pair = tuple(sorted([meds_lower[i], meds_lower[j]]))
            if pair in KNOWN_INTERACTIONS:
                info = KNOWN_INTERACTIONS[pair]
                interactions.append({
                    "drug_a": medications[i],
                    "drug_b": medications[j],
                    "severity": info["severity"],
                    "description": info["description"],
                })

    return interactions


async def check_drug_interactions(medications: list[str]) -> dict:
    """Check drug interactions — tries RxNav API first, falls back to local DB."""
    if len(medications) < 2:
        return {"interactions": [], "source": "none", "checked": len(medications)}

    interactions = await check_interactions_rxnav(medications)
    if interactions:
        return {"interactions": interactions, "source": "rxnav", "checked": len(medications)}

    interactions = check_interactions_local(medications)
    return {
        "interactions": interactions,
        "source": "curated_database",
        "checked": len(medications),
        "pairs_checked": len(medications) * (len(medications) - 1) // 2,
    }

"""Trustee KBS attestation client for Confidential Containers.

Fetches secrets from the Trustee Key Broker Service (KBS) via the
Confidential Data Hub (CDH) agent running inside the TDX Trust Domain.

When running inside a CoCo pod (runtimeClassName: kata-cc):
  - CDH agent listens on 127.0.0.1:8006
  - Attestation happens automatically via TDX hardware
  - Secrets are released only to verified TDX enclaves

When running outside CoCo (normal pod):
  - CDH agent is not present
  - Falls back to environment variables
"""

import logging
import os

import httpx

logger = logging.getLogger("healthcare.attestation")

CDH_BASE_URL = "http://127.0.0.1:8006"
KBS_RESOURCE_PATH = "cdh/resource"


async def fetch_secret_from_kbs(
    repository: str = "default",
    resource_type: str = "litellm",
    resource_name: str = "api-key",
    timeout: float = 5.0,
) -> str | None:
    """Fetch a secret from Trustee KBS via the CDH agent.

    Returns the secret value if attestation succeeds, None otherwise.
    """
    url = f"{CDH_BASE_URL}/{KBS_RESOURCE_PATH}/{repository}/{resource_type}/{resource_name}"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                secret = resp.text.strip()
                logger.info(
                    "Secret %s/%s retrieved via Trustee KBS (TDX attested)",
                    resource_type, resource_name,
                )
                return secret
            else:
                logger.warning(
                    "Trustee KBS returned %d for %s/%s — attestation may have failed",
                    resp.status_code, resource_type, resource_name,
                )
                return None
    except httpx.ConnectError:
        logger.info("CDH agent not available — not running inside CoCo pod")
        return None
    except Exception as e:
        logger.warning("Failed to fetch from Trustee KBS: %s", e)
        return None


async def get_litellm_api_key() -> str:
    """Get the LiteLLM API key — tries Trustee KBS first, falls back to env var."""
    kbs_key = await fetch_secret_from_kbs(
        repository="default",
        resource_type="litellm",
        resource_name="api-key",
    )
    if kbs_key:
        logger.info("Using LiteLLM API key from Trustee KBS (hardware-attested)")
        return kbs_key

    env_key = os.environ.get("LITELLM_API_KEY", "")
    if env_key:
        logger.info("Using LiteLLM API key from environment variable (not attested)")
        return env_key

    logger.warning("No LiteLLM API key available — inference will fail")
    return ""


async def is_running_in_tdx() -> bool:
    """Check if we're running inside a TDX Trust Domain."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{CDH_BASE_URL}/cdh/version")
            return resp.status_code == 200
    except Exception:
        return False

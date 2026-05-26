"""HMAC request authentication — mirrors Node's mlInferenceClient.sign():
    signature = HMAC_SHA256(secret, f"{ts}.{body}")  (hex)
Fails CLOSED when a secret is configured; open (dev) when it is not.
"""
import hashlib
import hmac
import time

from fastapi import Header, HTTPException, Request

from .config import config


def _expected(body: str, ts: str) -> str:
    return hmac.new(config.ML_SERVICE_SECRET.encode(), f"{ts}.{body}".encode(), hashlib.sha256).hexdigest()


async def verify_signature(
    request: Request,
    x_baalvion_ts: str = Header(default=""),
    x_baalvion_signature: str = Header(default=""),
):
    """FastAPI dependency: validate the HMAC over the RAW request body."""
    if not config.ML_SERVICE_SECRET:
        return  # dev / unsigned mode

    if not x_baalvion_ts or not x_baalvion_signature:
        raise HTTPException(status_code=401, detail="missing signature headers")

    try:
        skew = abs(time.time() * 1000 - float(x_baalvion_ts))
    except ValueError:
        raise HTTPException(status_code=401, detail="bad timestamp")
    if skew > config.SIGNATURE_TTL_S * 1000:
        raise HTTPException(status_code=401, detail="signature expired")

    raw = (await request.body()).decode("utf-8")
    expected = _expected(raw, x_baalvion_ts)
    if not hmac.compare_digest(expected, x_baalvion_signature):
        raise HTTPException(status_code=401, detail="invalid signature")

"""Sign a certificate request, so that verify.html shows "Verified by the issuer".

The issuer (the teacher or the owner of the site) keeps a private key on their own computer.
The public key is in assets/issuer-key.js. Never put the private key into the repository.

    python tools/sign_certificate.py --new-key                  make a key pair (one time)
    python tools/sign_certificate.py request.json --reviewer "Name" [--capstone 82]
                                                                 sign a request and print the link

A learner downloads request.json from the certificate page. Review the work first, for example
the capstone repository, then sign.
"""
import argparse
import base64
import hashlib
import json
import sys
from datetime import date
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

SITE = Path(__file__).resolve().parent.parent
KEY_DIR = Path.home() / ".ai-learning-manual"
PRIVATE_KEY = KEY_DIR / "issuer_private_key.pem"
PUBLIC_JS = SITE / "assets" / "issuer-key.js"
SITE_URL = "https://admiralxeon.github.io/ai-learning-site/"   # change this if the site moves


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def cert_id(record: dict) -> str:
    # The same rule as assets/site.js: SHA-256 of the sorted JSON without the id and the review fields.
    core = {k: v for k, v in record.items() if k not in ("id", "reviewed", "reviewer", "reviewedOn", "capstoneReviewed")}
    h = hashlib.sha256(json.dumps(core, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest().upper()
    return f"AIM-{h[:4]}-{h[4:8]}-{h[8:12]}"


def new_key():
    if PRIVATE_KEY.exists():
        sys.exit(f"A key already exists: {PRIVATE_KEY}. Delete it first if you really want a new one. "
                 "Links signed with the old key will stop working.")
    KEY_DIR.mkdir(parents=True, exist_ok=True)
    key = ec.generate_private_key(ec.SECP256R1())
    PRIVATE_KEY.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                              serialization.NoEncryption()))
    nums = key.public_key().public_numbers()
    jwk = {"kty": "EC", "crv": "P-256", "x": b64url(nums.x.to_bytes(32, "big")), "y": b64url(nums.y.to_bytes(32, "big"))}
    PUBLIC_JS.write_text("/* Made by tools/sign_certificate.py --new-key. The public key of the certificate issuer. */\n"
                         "window.ISSUER_KEY=" + json.dumps(jwk) + ";\n", encoding="utf-8", newline="\n")
    print(f"Private key: {PRIVATE_KEY}  (keep it safe, make a backup, never commit it)")
    print(f"Public key:  {PUBLIC_JS}  (commit this file, then run python tools/build.py)")


def sign(path, reviewer, capstone):
    if not PRIVATE_KEY.exists():
        sys.exit("No private key. Run: python tools/sign_certificate.py --new-key")
    record = json.loads(Path(path).read_text(encoding="utf-8"))
    if record.get("id") != cert_id(record):
        sys.exit("The id of the request does not agree with its data. Ask the learner for a new request.")
    record.update({"reviewed": True, "reviewer": reviewer, "reviewedOn": date.today().isoformat()})
    if capstone is not None:
        record["capstoneReviewed"] = capstone
    payload = b64url(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())
    key = serialization.load_pem_private_key(PRIVATE_KEY.read_bytes(), password=None)
    r, s = decode_dss_signature(key.sign(payload.encode(), ec.ECDSA(hashes.SHA256())))
    sig = b64url(r.to_bytes(32, "big") + s.to_bytes(32, "big"))   # the format that Web Crypto uses
    print(f"{SITE_URL}verify.html#d={payload}&s={sig}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("request", nargs="?")
    p.add_argument("--new-key", action="store_true")
    p.add_argument("--reviewer", default="Course issuer")
    p.add_argument("--capstone", type=int, help="the capstone score (percent) that you gave after your review")
    a = p.parse_args()
    if a.new_key:
        new_key()
    elif a.request:
        sign(a.request, a.reviewer, a.capstone)
    else:
        p.print_help()

## 2026-09-13 - Hardcoded Encryption Key Fallback
**Vulnerability:** A hardcoded encryption key was used as a fallback for the database encryption when `DATA_ENCRYPTION_KEY` was not set in the environment.
**Learning:** This repo used a fallback key to prevent existing deployments from losing access to encrypted data if a key was never set. However, hardcoding an encryption key directly into the source code is a critical vulnerability.
**Prevention:** Throw an error instead of providing a fallback key when an encryption key is missing to ensure a secure configuration from the start.

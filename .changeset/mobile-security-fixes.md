---
"@cosmq/mobile": patch
---

Security: verify the server hostname on Android TLS connections (previously only the certificate chain was checked), refuse a PostgreSQL login that skips the SCRAM server proof, and close four ways a destructive statement could run without the confirmation prompt. Fix MongoDB SCRAM-SHA-1 so password auth works against real servers.

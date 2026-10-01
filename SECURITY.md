# Security policy

Sintellum is designed to explain code without executing project code.

## V1 security guarantees

- Never execute PHP, Artisan, Composer scripts, Blade templates, or arbitrary commands from the analyzed workspace.
- Cloud AI receives only user-confirmed blocks plus minimal directly-required signatures.
- Obvious credentials and secret-like assignments are redacted before cloud payload construction.
- Cloud API keys live only in VS Code SecretStorage.
- Untrusted workspaces disable cloud AI, project persistence, and any feature that could write outside extension state.
- File access is constrained to the active workspace and canonicalized before use; traversal and symlink escapes are rejected.
- Webviews use a restrictive Content Security Policy and message schemas are validated before handling.
- No telemetry in V1.

## Reporting vulnerabilities

Please report suspected vulnerabilities privately to the project maintainer before public disclosure.

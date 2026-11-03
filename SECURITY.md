# Security and privacy

This is a local TLS interception bridge with a locally trusted CA. Review the code and trust prompt before installing. Loopback binding and authentication reduce exposure; they do not isolate the bridge from malicious software running as the same OS user.

Never publish connection.json, effective.json, settings journals, status snapshots, backups, CA material, database files, model request bodies, logs, or local runtime executables. The source repository intentionally excludes these files and prebuilt binaries. Compilation paths and personal details can be embedded in locally built executables, so those should not be uploaded without separate inspection.

The bridge stores sessions in memory. Its runtime configuration still contains a Magpie Agent gateway key on disk, with mode 0600 in a mode 0700 directory. Cursor, Magpie and upstream providers have their own retention policies. Other Cursor traffic can still go to Cursor's official services.

Verified behaviors: rejected unauthenticated backend and proxy access; rejected an absolute-HTTPS authentication bypass attempt; rejected browser Origin requests; authenticated TLS model catalogue response; Bidi/RunSSE text response; byte-for-byte restoration of unchanged Cursor settings after disconnect. JavaScript tests cover gateway validation, redirect rejection, catalogue restrictions and settings restoration. This is not a comprehensive independent security audit.

Do not put secrets in public issues. Report a suspected vulnerability without exploit credentials, request bodies or private configuration. Use GitHub private vulnerability reporting if enabled by the repository owner; otherwise request a private reporting channel before providing sensitive details.

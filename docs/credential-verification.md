# Credential History Verification

Tool: Gitleaks 8.30.1

Preparation:
- Fetched remote references with git fetch origin.
- git rev-parse --is-shallow-repository returned false.

Command:
.git/exam-tools/gitleaks git --log-opts="--all" --redact=100 .

Observed result:
- 11 commits scanned.
- No leaks found.

Credentials are stored in the ignored .env.local file.
The scanner executable is inside .git/exam-tools and is not tracked.

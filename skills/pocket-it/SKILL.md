---
name: pocket-it
description: Send AI-generated artifacts and local text files to the Pocket It iOS app using the plugin's bundled sender. Use when the user says "把这个发到手机", "发到 Pocket It", "把刚才生成的 PRD 发给我", "把这个 Markdown 发到手机", "send this to my phone", "send this to Pocket It", or otherwise asks to send the current artifact or a referenced local file to their phone.
---

# Send to Pocket It

Identify the artifact, preserve its source, and call the bundled sender.

## Resolve the artifact

1. Prefer an explicit local file path from the user.
2. Otherwise select the most recent completed artifact clearly referenced by words such as "这个", "刚才生成的 PRD", or "this Markdown". Do not select logs or an unfinished draft.
3. If the artifact exists only in the conversation, save exactly that completed content as a new local file in the current workspace. Use Markdown for text unless the user explicitly requested another supported format. Choose a descriptive filename and never overwrite an existing file.
4. If two or more artifacts are equally plausible, ask which one to send before writing or sending anything.
5. Never edit, normalize, or add frontmatter to the user's original file. The sender creates a separate delivered copy in the Pocket It workspace.

Supported inputs are `.md`, `.markdown`, `.mdown`, `.mkd`, and `.txt` files. Save conversation-only text as `.md` by default.

## Send

Derive a short title, project, and type from the artifact and task. Valid conventional types are `research`, `review`, `plan`, `summary`, and `note`.

Resolve the sender from this Skill's installed location, not from the current working directory:

```bash
node "<absolute directory containing this SKILL.md>/../../scripts/pocket-it-send.mjs" \
  "<absolute artifact path>" \
  --title "<short title>" \
  --project "<project>" \
  --type "<type>"
```

Pass `--series <slug>` only when the artifact updates an earlier Pocket It item in the same series. Pass `--path <workspace>` only when the user supplied an explicit Pocket It workspace.

Do not invoke a global `pocketit` or `pocket-it` command. Do not install runtime dependencies.

## Interpret the result

Only report success when the process exits with code 0 and its JSON output has `ok: true` and `status: "delivered"`. Include the returned item ID or path in the confirmation. `syncState: "local-container-write-complete"` confirms the atomic local iCloud-container write; do not claim that the phone has downloaded it unless separately verified.

On a nonzero exit, do not say the artifact was sent. Surface the script's `code` and actionable `message`:

- `CONFIGURATION_MISSING`: configure `POCKETIT_WORKSPACE`, pass an approved `--path`, or initialize Pocket It with the standalone CLI.
- `AUTHENTICATION_FAILED`: sign in to iCloud and reopen Pocket It.
- `ICLOUD_UNAVAILABLE`: check iCloud Drive, container publication, and filesystem permissions.
- `UNSUPPORTED_FILE_TYPE`: save text as Markdown or use another supported extension without changing the original.
- `FILE_NOT_FOUND`: re-resolve the referenced artifact or local path.
- `EMPTY_ARTIFACT`: save non-empty completed content before retrying.
- `SYNC_FAILED` or `DELIVERY_FAILED`: preserve the original and report the exact failure; retry only when doing so is safe.

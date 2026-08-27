# Pocket It Plugin

Send an AI-generated Markdown artifact to the **Pocket It** inbox on your iPhone with one sentence.

> “Send this PRD to my phone.”  
> “把刚才生成的报告发到 Pocket It。”

Pocket It packages one portable Agent Skill for **Codex**, **Claude Code**, and **Cursor**. Its bundled sender writes an atomic delivered copy into the Pocket It iCloud workspace; it does not require a global CLI, an npm install, or a hosted relay service.

## Requirements

- macOS with iCloud Drive signed in
- Pocket It installed and opened once on the iPhone
- Node.js 18 or newer
- A local Codex, Claude Code, or Cursor session running on the Mac that can access the iCloud workspace

The default workspace is:

```text
~/Library/Mobile Documents/iCloud~com~pocketit~app/Documents
```

If you use a different workspace, expose it to the agent process:

```bash
export POCKETIT_WORKSPACE="/absolute/path/to/Pocket-It"
```

## Install

### Codex

```bash
codex plugin marketplace add lzh20025/pocket-it-plugin
codex plugin add pocket-it@pocket-it-marketplace
```

Start a new Codex session after installation. You can ask naturally or invoke `$pocket-it` explicitly.

### Claude Code

```bash
claude plugin marketplace add lzh20025/pocket-it-plugin
claude plugin install pocket-it@pocket-it-marketplace
```

Run `/reload-plugins` if Claude Code asks you to reload. The explicit skill command is `/pocket-it:pocket-it`.

For local development instead:

```bash
git clone https://github.com/lzh20025/pocket-it-plugin.git
claude --plugin-dir ./pocket-it-plugin
```

### Cursor

Cursor loads this repository as an [Agent Plugin](https://cursor.com/docs/plugins), the open format it supports for portable skills. For a local install:

```bash
git clone https://github.com/lzh20025/pocket-it-plugin.git
mkdir -p ~/.cursor/plugins/local
ln -s "$(pwd)/pocket-it-plugin" ~/.cursor/plugins/local/pocket-it
```

Restart Cursor or run **Developer: Reload Window**, then confirm **Pocket It** appears under **Customize**. The explicit skill command is `/pocket-it`.

## Use

Ask the agent to send the current artifact or name a file:

```text
Send the artifact we just created to Pocket It.
Send ./docs/product-spec.md to my phone.
把刚才生成的 PRD 发到手机。
```

The skill resolves the referenced artifact, derives a title and metadata, and calls the bundled sender. Supported inputs are `.md`, `.markdown`, `.mdown`, `.mkd`, and `.txt`.

Success means the file was written and verified in the local iCloud container. It does **not** guarantee that the iPhone has already downloaded the change; final delivery latency is controlled by iCloud.

## How the three integrations map

| Host | Entry point | Skill source |
| --- | --- | --- |
| Codex | `.codex-plugin/plugin.json` | `skills/pocket-it/SKILL.md` |
| Claude Code | `.claude-plugin/plugin.json` | `skills/pocket-it/SKILL.md` |
| Cursor | `plugin.json` (Agent Plugins standard) | `skills/pocket-it/SKILL.md` |

All three hosts run the same self-contained `scripts/pocket-it-send.mjs`; there are no duplicated implementations to drift apart.

## Development

Validate the manifests and run the relocated-plugin smoke test:

```bash
node scripts/validate-manifests.mjs
node scripts/smoke-test.mjs
```

The smoke test uses a temporary workspace. It does not write to your real Pocket It inbox.

## Privacy and safety

- The sender reads only the selected local text artifact.
- It never edits the original file.
- It writes a separate delivered copy to the configured Pocket It workspace.
- No Pocket It-operated relay server is involved; after the local write, Apple iCloud handles device sync.

## License

MIT

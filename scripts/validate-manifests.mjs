#!/usr/bin/env node
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = {
  agent: "plugin.json",
  claude: ".claude-plugin/plugin.json",
  claudeMarketplace: ".claude-plugin/marketplace.json",
  codex: ".codex-plugin/plugin.json",
  codexMarketplace: ".agents/plugins/marketplace.json",
};

const manifests = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([key, relativePath]) => [
      key,
      JSON.parse(await readFile(path.join(pluginRoot, relativePath), "utf8")),
    ]),
  ),
);

for (const manifest of [manifests.agent, manifests.claude, manifests.codex]) {
  assert.equal(manifest.name, "pocket-it");
  assert.equal(manifest.version, manifests.codex.version);
}

assert.equal(
  manifests.agent.$schema,
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
);
assert.equal(manifests.codex.skills, "./skills/");
assert.equal(manifests.claudeMarketplace.name, "pocket-it-marketplace");
assert.equal(manifests.claudeMarketplace.plugins[0].name, "pocket-it");
assert.equal(manifests.claudeMarketplace.plugins[0].version, manifests.codex.version);
assert.equal(manifests.codexMarketplace.plugins[0].name, "pocket-it");

await Promise.all([
  access(path.join(pluginRoot, "skills/pocket-it/SKILL.md")),
  access(path.join(pluginRoot, "scripts/pocket-it-send.mjs")),
]);

process.stdout.write(`${JSON.stringify({
  ok: true,
  plugin: "pocket-it",
  version: manifests.codex.version,
  hosts: ["Codex", "Claude Code", "Cursor"],
}, null, 2)}\n`);

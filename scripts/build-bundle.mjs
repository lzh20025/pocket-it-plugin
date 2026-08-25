#!/usr/bin/env node
import { chmod, mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const repositoryRoot = path.resolve(pluginRoot, "../..");
const cliRoot = path.join(repositoryRoot, "cli");
const requireFromCli = createRequire(path.join(cliRoot, "package.json"));
const { build } = requireFromCli("esbuild");
const outfile = path.join(scriptDir, "pocket-it-send.mjs");

await mkdir(scriptDir, { recursive: true });
await build({
  entryPoints: [path.join(cliRoot, "src", "plugin-entry.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  packages: "bundle",
  sourcemap: false,
  minify: false,
  legalComments: "none",
  banner: {
    js: [
      "// Generated from cli/src/plugin-entry.ts; do not edit this bundle by hand.",
      'import { createRequire as __pocketItCreateRequire } from "node:module";',
      "const require = __pocketItCreateRequire(import.meta.url);",
    ].join("\n"),
  },
});
await chmod(outfile, 0o755);
process.stdout.write(`Built ${outfile}\n`);

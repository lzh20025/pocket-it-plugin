#!/usr/bin/env node
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const sourcePluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scratch = await mkdtemp(path.join(tmpdir(), "pocket-it-plugin-smoke-"));

try {
  const installedRoot = path.join(scratch, "relocated", "pocket-it");
  const unrelatedCwd = path.join(scratch, "unrelated-cwd");
  const workspace = path.join(scratch, "workspace");
  const artifact = path.join(scratch, "artifact.md");
  await cp(sourcePluginRoot, installedRoot, { recursive: true });
  await mkdir(unrelatedCwd, { recursive: true });
  await mkdir(workspace, { recursive: true });
  await writeFile(artifact, "# Relocated Plugin Smoke Test\n\nBundle path resolution works.\n", "utf8");

  const skillDir = path.join(installedRoot, "skills", "pocket-it");
  const bundledSender = path.resolve(skillDir, "../../scripts/pocket-it-send.mjs");
  assert.equal((await stat(bundledSender)).isFile(), true);

  const success = await runSender(bundledSender, [
    artifact,
    "--title", "Relocated Plugin Smoke Test",
    "--project", "pocket-it",
    "--type", "note",
  ], unrelatedCwd, { POCKETIT_WORKSPACE: workspace });
  assert.equal(success.code, 0, success.stderr);
  const result = JSON.parse(success.stdout.trim());
  assert.equal(result.ok, true);
  assert.equal(result.status, "delivered");
  assert.equal(result.syncState, "local-container-write-complete");
  assert.equal((await stat(result.itemPath)).isFile(), true);
  assert.equal(await readFile(artifact, "utf8"), "# Relocated Plugin Smoke Test\n\nBundle path resolution works.\n");

  const missing = await runSender(
    bundledSender,
    [path.join(scratch, "missing.md")],
    unrelatedCwd,
    { POCKETIT_WORKSPACE: workspace },
  );
  assert.equal(missing.code, 2);
  assert.equal(JSON.parse(missing.stderr.trim()).code, "FILE_NOT_FOUND");

  const unsupportedFile = path.join(scratch, "artifact.pdf");
  await writeFile(unsupportedFile, "%PDF smoke", "utf8");
  const unsupported = await runSender(
    bundledSender,
    [unsupportedFile],
    unrelatedCwd,
    { POCKETIT_WORKSPACE: workspace },
  );
  assert.equal(unsupported.code, 2);
  assert.equal(JSON.parse(unsupported.stderr.trim()).code, "UNSUPPORTED_FILE_TYPE");

  const isolatedHome = path.join(scratch, "isolated-home");
  await mkdir(isolatedHome, { recursive: true });
  const unconfigured = await runSender(bundledSender, [artifact], unrelatedCwd, {
    HOME: isolatedHome,
    POCKETIT_WORKSPACE: "",
  });
  assert.equal(unconfigured.code, 3);
  assert.equal(JSON.parse(unconfigured.stderr.trim()).code, "CONFIGURATION_MISSING");

  process.stdout.write(`${JSON.stringify({
    ok: true,
    relocatedPlugin: installedRoot,
    invokedBundle: bundledSender,
    deliveredItem: result.itemPath,
    verifiedErrors: [
      "FILE_NOT_FOUND",
      "UNSUPPORTED_FILE_TYPE",
      "CONFIGURATION_MISSING",
    ],
  }, null, 2)}\n`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}

function runSender(script, args, cwd, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

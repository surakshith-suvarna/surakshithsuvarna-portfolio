import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";

const vinextRequire = createRequire(new URL("../node_modules/vinext/package.json", import.meta.url));
const parserCjs = vinextRequire.resolve("image-size");
const parserEsm = pathToFileURL(resolve(dirname(parserCjs), "index.mjs")).href;

function box(type, payload = Buffer.alloc(0), size = payload.length + 8) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(size);
  header.write(type, 4, "ascii");
  return Buffer.concat([header, payload]);
}

test("image parser terminates on malformed ICNS, JXL and HEIF box lengths", () => {
  // Run in a separate process: a synchronous parser loop cannot be interrupted
  // by a promise timeout in this test process. Never send these fixtures live.
  const fixtures = [];
  for (const size of [0, 1, 7]) {
    fixtures.push(box("icns", box("ic07", Buffer.alloc(0), size)));
    fixtures.push(Buffer.concat([
      box("JXL ", Buffer.from([13, 10, 135, 10])),
      box("ftyp", Buffer.from("jxl \0\0\0\0jxl ")),
      box("jxlp", Buffer.alloc(8), size),
    ]));
    const dimensions = Buffer.alloc(12);
    dimensions.writeUInt32BE(16, 4);
    dimensions.writeUInt32BE(16, 8);
    fixtures.push(Buffer.concat([
      box("ftyp", Buffer.from("heic\0\0\0\0heic")),
      box("meta", Buffer.concat([
        Buffer.alloc(4), box("iprp", box("ipco", box("ispe", dimensions, size))),
      ])),
    ]));
  }
  const script = `
    const parsers = [require(${JSON.stringify(parserCjs)}).imageSize,
      (await import(${JSON.stringify(parserEsm)})).imageSize];
    for (const parse of parsers) {
      for (const hex of ${JSON.stringify(fixtures.map((input) => input.toString("hex")))}) {
        try { parse(Buffer.from(hex, "hex")); }
        catch (error) { if (!(error instanceof Error)) throw error; }
      }
    }
    process.stdout.write("completed");
  `;
  const result = spawnSync(process.execPath, ["--max-old-space-size=64", "-e",
    `(async () => { ${script} })().catch(error => { console.error(error); process.exitCode = 1; });`],
  { encoding: "utf8", timeout: 3000, killSignal: "SIGKILL", maxBuffer: 8192 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "completed");
});

test("replacement preserves social-card dimensions through CommonJS and ESM", async () => {
  const parsers = [vinextRequire("image-size").imageSize, (await import(parserEsm)).imageSize];
  for (const file of ["og.png", "social/3cx-post-call-analytics.png",
    "social/microsoft-teams-insights.png", "social/primary-datacentre-migration-v2.png"]) {
    const input = readFileSync(new URL(`../public/${file}`, import.meta.url));
    // PNG IHDR dimensions provide an independent expectation for these assets.
    assert.equal(input.subarray(1, 4).toString("ascii"), "PNG");
    for (const parse of parsers) {
      const result = parse(input);
      assert.equal(result.width, input.readUInt32BE(16), file);
      assert.equal(result.height, input.readUInt32BE(20), file);
      assert.equal(result.type, "png");
    }
  }
});

test("Drizzle's legacy loader transforms TypeScript with patched esbuild", async () => {
  const require = createRequire(import.meta.url);
  const { transform, transformSync } = require("@esbuild-kit/core-utils");
  const source = "const value: number = 42; export default value;";
  const file = resolve("dependency-compatibility.cts");
  for (const result of [transformSync(source, file, { format: "cjs" }),
    await transform(source, file, { format: "cjs" })]) {
    const context = { module: { exports: {} } };
    runInNewContext(result.code, context);
    assert.equal(context.module.exports.default, 42);
    assert.ok(result.map);
  }
});

#!/usr/bin/env node
/**
 * Contract tests: validate golden examples against JSON Schemas.
 * Also asserts that intentional invalid fixtures are rejected.
 *
 * Usage: node scripts/validate-schemas.mjs
 * Exit 0 on success, 1 on any failure.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
  validateSchema: true,
});
addFormats(ajv);

function loadJson(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${rel}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function listJson(dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(dir, f));
}

/** @type {{ schema: string, valid: string[], invalid: string[] }[]} */
const suites = [
  {
    schema: "schemas/link-record.schema.json",
    valid: listJson("examples/link-records"),
    invalid: listJson("examples/invalid/link-records"),
  },
  {
    schema: "schemas/discovery-message.schema.json",
    valid: listJson("examples/discovery-messages"),
    invalid: listJson("examples/invalid/discovery-messages"),
  },
  {
    schema: "schemas/discover-request.schema.json",
    valid: listJson("examples/discover-request"),
    invalid: listJson("examples/invalid/discover-request"),
  },
  {
    schema: "schemas/discover-response.schema.json",
    valid: listJson("examples/discover-response"),
    invalid: listJson("examples/invalid/discover-response"),
  },
];

let failed = 0;
let passed = 0;

console.log("AutoFix Polyglot — schema validation\n");

for (const suite of suites) {
  const schemaDoc = loadJson(suite.schema);
  let validate;
  try {
    validate = ajv.compile(schemaDoc);
  } catch (err) {
    console.error(`✗ SCHEMA INVALID  ${suite.schema}`);
    console.error(`  ${err instanceof Error ? err.message : err}`);
    failed++;
    continue;
  }
  console.log(`✓ schema ok       ${suite.schema}`);
  passed++;

  for (const file of suite.valid) {
    const data = loadJson(file);
    const ok = validate(data);
    if (ok) {
      console.log(`✓ valid           ${file}`);
      passed++;
    } else {
      console.error(`✗ EXPECTED VALID  ${file}`);
      for (const e of validate.errors || []) {
        console.error(`    ${e.instancePath || "/"} ${e.message}`);
      }
      failed++;
    }
  }

  for (const file of suite.invalid) {
    const data = loadJson(file);
    const ok = validate(data);
    if (!ok) {
      console.log(`✓ rejected        ${file}`);
      passed++;
    } else {
      console.error(`✗ EXPECTED INVALID ${file} (schema accepted it)`);
      failed++;
    }
  }
}

// Guard: at least one valid fixture per core schema must exist
const requiredValid = [
  "examples/link-records",
  "examples/discovery-messages",
];
for (const dir of requiredValid) {
  if (listJson(dir).length === 0) {
    console.error(`✗ missing fixtures under ${dir}/`);
    failed++;
  }
}

console.log("");
if (failed > 0) {
  console.error(`FAILED: ${failed} check(s) failed, ${passed} passed`);
  process.exit(1);
}
console.log(`OK: ${passed} check(s) passed`);
process.exit(0);

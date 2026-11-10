import test from "node:test";
import assert from "node:assert/strict";

// We read and parse team data to verify non-negotiable rules
test("Team Data Integrity: Asserts exactly 6 contributor profiles exist", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const teamDataPath = path.resolve("./src/lib/team-data.ts");
  const content = fs.readFileSync(teamDataPath, "utf-8");

  // Verify non-negotiable team member count
  const idMatches = content.match(/id:\s*"mem-\d+"/g);
  assert.ok(idMatches, "Team member ID declarations must exist");
  assert.equal(idMatches.length, 6, "Must define exactly 6 contributor profiles for E-Health Hackathon 2026");

  // Verify ShasthoSetu stage is defined properly
  assert.match(content, /stage:\s*"DEVELOPMENT"/, "ShasthoSetu must be marked in DEVELOPMENT stage, not fabricated as COMPLETED");

  // Verify data isolation notice
  assert.match(content, /Zero PHI|separation|isolation/i, "Team data must mention data separation or zero-PHI guidelines");
});

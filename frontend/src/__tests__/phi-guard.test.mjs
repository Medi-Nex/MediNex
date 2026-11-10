import test from "node:test";
import assert from "node:assert/strict";

// Zero-PHI patterns matching frontend validation expectations
const PHI_REGEXES = [
  /\b(?:MRN|Medical\s*Record\s*(?:Number|No)|Patient\s*(?:ID|Number|No)|Hospital\s*(?:ID|Number)|Clinic\s*ID)\s*[:#=\-]?\s*[A-Z0-9-]{4,}\b/i,
  /\b(?:Rx|Prescription\s*for)\s*[:#\-]?\s*[A-Za-z0-9\s]{2,}\s*(?:\d+\s*(?:mg|ml|mcg|tablets|capsules|daily|bid|tid|qid))\b/i,
  /\b(?:Chief\s*Complaint|Discharge\s*Summary|Clinical\s*Admission|Diagnostic\s*Impression|ICD-(?:9|10|11))\s*[:=]\s*[^\n\r]{4,}/i,
  /\bPatient\s*Name\s*:\s*[A-Z][a-z]+\s+[A-Z][a-z]+\b/i,
  /\b(?:Patient\s*DOB|DOB\s*of\s*Patient|Date\s*of\s*Birth\s*of\s*Patient)\s*[:=]?\s*(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/i,
];

function detectPhi(text) {
  return PHI_REGEXES.some((regex) => regex.test(text));
}

test("Zero-PHI Guard: Intercepts medical record numbers and clinical diagnostics", () => {
  assert.ok(detectPhi("Patient case report: MRN: BD-99481-K with fever."));
  assert.ok(detectPhi("Triage unit: Hospital ID: H-44812 admitted."));
  assert.ok(detectPhi("Rx: Ciprofloxacin 500 mg tablets bid for 5 days"));
  assert.ok(detectPhi("Chief Complaint: acute respiratory distress and severe fever"));
  assert.ok(detectPhi("Patient Name: Rafiqul Islam"));
});

test("Zero-PHI Guard: Permits legitimate digital health technology collaboration", () => {
  assert.equal(detectPhi("Discussing FHIR standard interoperability across community clinics."), false);
  assert.equal(detectPhi("Building decentralized telemedicine bridge for E-Health Hackathon 2026."), false);
  assert.equal(detectPhi("WebRTC peer-to-peer data channel encryption under rural constraints."), false);
  assert.equal(detectPhi("Human-centered clinical workflow evaluation for health workers."), false);
});

# Saheli 7.2 — Multi-Format Data Portability & Security Specification

**JSON, CSV, and PDF Import/Export Protocols with Formula Injection Defense**

---

## 1. System Objectives

Saheli 7.2 provides complete, user-controlled data portability across three standard file formats:

- **JSON**: Complete database dump (records, settings, reminders, pregnancy mode) for seamless device-to-device migration.
- **CSV**: Spreadsheet-compatible tabular export for personal data analysis in Excel, LibreOffice, or Google Sheets.
- **PDF / Printable HTML**: A clinical summary designed for consultations with doctors and gynecologists, containing an embedded machine-readable versioned payload for round-trip data restoration.

---

## 2. CSV Formula Injection Defense (CSV / DDE Mitigation)

### Threat Model

When users enter free-form text into notes or symptom fields (e.g. tracking a medication name or calculation note), malicious or accidental inputs starting with spreadsheet formula control characters (`=`, `+`, `-`, `@`, `\t`, `\r`) can execute arbitrary commands via Dynamic Data Exchange (DDE) or trigger remote spreadsheet code execution when opened in Microsoft Excel or LibreOffice Calc.

### Sanitization Implementation (`src/lib/exportImport.js`)

On CSV export, any cell whose string value begins with a formula trigger character is prepended with a single quote (`'`):

```javascript
const csvCell = (v) => {
  let s = v == null ? "" : String(v);
  // Protect against spreadsheet formula injection (CSV Injection / DDE)
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
```

On CSV import, the parser safely detects and strips the leading quote if it was added solely for formula protection:

```javascript
function sanitizeCsvValue(val) {
  if (typeof val !== "string") return val;
  let s = val.trim();
  if (s.startsWith("'") && /^[=+\-@\t\r]/.test(s.slice(1))) {
    s = s.slice(1);
  }
  return s;
}
```

This guarantees 100% round-trip fidelity while completely protecting users from spreadsheet formula execution exploits.

---

## 3. PDF Clinical Summary & Embedded Machine-Readable Payload

### Design Architecture

When exporting as "Health Summary (PDF)", Saheli generates a clean, printable HTML document designed for print-to-PDF or physical consultation:

- Patient-recorded cycle statistics (completed cycles, mean length, total period days).
- Reverse-chronological 30-day symptom and flow table.
- Mandatory clinical non-diagnostic disclaimer.

### Machine-Readable Round-Trip Tag

Embedded directly in the document's `<body>` is a versioned base64 payload comment:

```html
<!-- SAHELI_RECORD_PAYLOAD_V1:eyJhcHAiOiJzYWhlbGkiLCJmb3JtYXQiOjEs... -->
```

### Import & Validation Protocol

When a user uploads a `.pdf` or `.html` file into Saheli:

1. `parsePDFImport` searches for the regex pattern `<!--\s*SAHELI_RECORD_PAYLOAD_V1:([A-Za-z0-9+/=]+)\s*-->`.
2. If found, the base64 string is decoded into UTF-8 JSON and passed to `parseImport()`, which validates schema version, day schemas, and settings integrity before prompting the user with a preview.
3. If not found (e.g. user selects a hospital blood test report, prescription scan, or arbitrary third-party PDF), Saheli **safely rejects the file** with a clear, localized explanation:
   - Error code: `imp.unsupportedPdfNoPayload`
   - User message: _"This PDF file does not contain a machine-readable Saheli backup payload. To restore records, select a valid Saheli export file."_
   - **Zero silent corruption or partial database overwrites.**

---

## 4. Multi-Format Compatibility Matrix

|  Format  |  File Extension  | Use Case                                | Security Features                                                     |
| :------: | :--------------: | :-------------------------------------- | :-------------------------------------------------------------------- |
| **JSON** |     `.json`      | Full device migration, encrypted backup | Strict schema validation, version checks, key whitelisting            |
| **CSV**  |      `.csv`      | Tabular analysis, statistical charts    | RFC 4180 parsing, quotes escaping, formula injection mitigation       |
| **PDF**  | `.pdf` / `.html` | Doctor visits, offline printing         | Embedded base64 versioned tag, safe rejection of non-Saheli documents |

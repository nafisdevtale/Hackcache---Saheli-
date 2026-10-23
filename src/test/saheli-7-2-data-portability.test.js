import { describe, it, expect } from "vitest";
import {
  exportCSV,
  parseCSVImport,
  generateDoctorSummaryPDF,
  parsePDFImport,
  exportJSON,
  parseImport,
  emptyRecord,
  blankDay,
} from "@/lib/exportImport.js";

describe("Saheli 7.2 — Multi-Format Data Portability & Formula Injection Security", () => {
  describe("CSV Formula Injection (CSV / DDE Injection Mitigation)", () => {
    it("mitigates spreadsheet formula injection by prefixing risky leading characters", () => {
      const rec = emptyRecord();
      rec.days["2026-10-01"] = {
        ...blankDay("2026-10-01"),
        period: true,
        flow: "heavy",
        pain: 3,
        symptoms: ["cramps"],
        note: "=SUM(A1:A10)", // Dangerous formula prefix
        medicines: "+cmd|' /C calc'!A0", // DDE attack pattern
      };
      rec.days["2026-10-02"] = {
        ...blankDay("2026-10-02"),
        period: true,
        flow: "medium",
        pain: 1,
        symptoms: [],
        note: "@HYPERLINK('http://attacker.com')",
        medicines: "-5+10",
      };

      const csv = exportCSV(rec);

      // Verify each dangerous cell begins with single quote
      expect(csv).toContain("'+cmd");
      expect(csv).toContain("'=SUM(A1:A10)");
      expect(csv).toContain("'@HYPERLINK");
      expect(csv).toContain("'-5+10");

      // Round-trip verification: parseCSVImport must safely unescape back to original user text
      const parsed = parseCSVImport(csv);
      expect(parsed.ok).toBe(true);
      const day1 = parsed.record.days["2026-10-01"];
      expect(day1.note).toBe("=SUM(A1:A10)");
      expect(day1.medicines).toBe("+cmd|' /C calc'!A0");

      const day2 = parsed.record.days["2026-10-02"];
      expect(day2.note).toBe("@HYPERLINK('http://attacker.com')");
      expect(day2.medicines).toBe("-5+10");
    });

    it("parses valid CSV records and normalizes flow and symptoms", () => {
      const csvData = `date,period,flow,pain,symptoms,note
2026-09-15,true,heavy,4,cramps;bloating,Severe cramping on day 1
2026-09-16,true,medium,2,tiredness,Felt much better today
2026-09-17,false,,0,,`;

      const result = parseCSVImport(csvData);
      expect(result.ok).toBe(true);
      expect(result.validCount).toBe(3);

      const d1 = result.record.days["2026-09-15"];
      expect(d1.period).toBe(true);
      expect(d1.flow).toBe("heavy");
      expect(d1.pain).toBe(4);
      expect(d1.symptoms).toEqual(["cramps", "bloating"]);
      expect(d1.note).toBe("Severe cramping on day 1");
    });

    it("safely rejects corrupted or headerless CSV files", () => {
      const emptyResult = parseCSVImport("");
      expect(emptyResult.ok).toBe(false);
      expect(emptyResult.error).toBe("imp.csvEmpty");

      const missingDateHeader = parseCSVImport("foo,bar,baz\n1,2,3");
      expect(missingDateHeader.ok).toBe(false);
      expect(missingDateHeader.error).toBe("imp.csvMissingDateHeader");
    });
  });

  describe("Doctor Summary PDF / HTML with Machine-Readable Payload", () => {
    it("embeds a versioned base64 payload into the generated summary document", () => {
      const rec = emptyRecord();
      rec.days["2026-10-10"] = {
        ...blankDay("2026-10-10"),
        period: true,
        flow: "heavy",
        pain: 3,
        symptoms: ["cramps", "headache"],
        note: "Doctor consultation prep",
      };

      const analysis = {
        cycles: [{ start: "2026-09-10", length: 28 }],
        stats: { meanLength: 28 },
      };

      const doc = generateDoctorSummaryPDF(rec, analysis);

      expect(doc).toContain("<!DOCTYPE html>");
      expect(doc).toContain("Saheli · Clinical Health Summary");
      expect(doc).toContain("<!-- SAHELI_RECORD_PAYLOAD_V1:");
      expect(doc).toContain("2026-10-10");

      // Verify that parsePDFImport reconstructs the exact record from the document
      const restored = parsePDFImport(doc);
      expect(restored.ok).toBe(true);
      expect(restored.record.days["2026-10-10"]).toBeDefined();
      expect(restored.record.days["2026-10-10"].period).toBe(true);
      expect(restored.record.days["2026-10-10"].flow).toBe("heavy");
      expect(restored.record.days["2026-10-10"].symptoms).toContain("cramps");
    });

    it("safely rejects arbitrary or scanned PDFs lacking the Saheli embedded payload", () => {
      const arbitraryPdf = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Title (Lab Blood Test Results) /Author (Diagnostic Center) >>
endobj
xref
0 2
trailer << /Root 1 0 R >>
%%EOF`;

      const result = parsePDFImport(arbitraryPdf);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("imp.unsupportedPdfNoPayload");
    });

    it("safely rejects printed HTML/PDF when comments have been stripped by print drivers", () => {
      const strippedHtml = `<!DOCTYPE html><html><body><h1>Saheli · Clinical Health Summary</h1><table><tr><td>2026-10-10</td><td>Period</td></tr></table></body></html>`;
      const result = parsePDFImport(strippedHtml);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("imp.unsupportedPdfNoPayload");
    });
  });

  describe("JSON Full Record Portability", () => {
    it("round-trips entire diary, settings, pregnancy and reminders cleanly", () => {
      const rec = emptyRecord();
      rec.settings.ageGroup = "adult";
      rec.settings.showFertility = true;
      rec.reminders.daily.on = true;
      rec.reminders.daily.time = "21:30";
      rec.days["2026-08-01"] = {
        ...blankDay("2026-08-01"),
        period: true,
        flow: "light",
        pain: 0,
        symptoms: [],
        note: "Normal cycle start",
      };

      const jsonStr = exportJSON(rec);
      const parsed = parseImport(jsonStr);

      expect(parsed.ok).toBe(true);
      expect(parsed.record.settings.ageGroup).toBe("adult");
      expect(parsed.record.reminders.daily.time).toBe("21:30");
      expect(parsed.record.days["2026-08-01"].flow).toBe("light");
    });
  });
});

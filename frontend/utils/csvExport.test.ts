import { describe, it, expect } from "vitest";
import { convertArrayToCSV } from "./csvExport";

// convertArrayToCSV is the public surface; the first data row reflects how
// escapeCsvCell rendered each value. We assert against that row.
function exportSingleCell(value: unknown): string {
    const csv = convertArrayToCSV([{ col: value }]);
    // csv === "col\n<rendered cell>"
    return csv.split("\n").slice(1).join("\n");
}

describe("escapeCsvCell formula-injection neutralization", () => {
    // Each dangerous leading character must be prefixed with a single quote so
    // spreadsheet apps treat the cell as text rather than an executable formula.
    const dangerous: Array<[string, string, string]> = [
        ["equals", "=1+1", "'=1+1"],
        ["plus", "+1+1", "'+1+1"],
        ["minus", "-1+1", "'-1+1"],
        ["at", "@SUM(A1)", "'@SUM(A1)"],
        ["tab", "\tcmd", "'\tcmd"],
        ["carriage return", "\rcmd", "'\rcmd"],
    ];

    for (const [name, input, expected] of dangerous) {
        it(`neutralizes a leading ${name} character`, () => {
            expect(exportSingleCell(input)).toBe(expected);
        });
    }

    it("neutralizes a classic CSV-injection payload", () => {
        const payload = "=HYPERLINK(\"http://evil.com\",\"click\")";
        // Leading "=" is neutralized; embedded quotes are still CSV-escaped and
        // the embedded comma forces the cell to be wrapped in quotes.
        expect(exportSingleCell(payload)).toBe(
            '"\'=HYPERLINK(""http://evil.com"",""click"")"'
        );
    });
});

describe("escapeCsvCell normal values", () => {
    it("leaves plain text unchanged", () => {
        expect(exportSingleCell("hello world")).toBe("hello world");
    });

    it("leaves numbers unchanged", () => {
        expect(exportSingleCell(1234.5)).toBe("1234.5");
    });

    it("renders null/undefined as empty", () => {
        expect(exportSingleCell(null)).toBe("");
        expect(exportSingleCell(undefined)).toBe("");
    });

    it("does not flag a hyphen that is mid-string", () => {
        expect(exportSingleCell("a-b-c")).toBe("a-b-c");
    });
});

describe("escapeCsvCell quoting behavior is preserved", () => {
    it("quotes cells containing a comma", () => {
        expect(exportSingleCell("a,b")).toBe('"a,b"');
    });

    it("escapes and quotes cells containing double quotes", () => {
        expect(exportSingleCell('she said "hi"')).toBe('"she said ""hi"""');
    });

    it("quotes cells containing a newline", () => {
        expect(exportSingleCell("line1\nline2")).toBe('"line1\nline2"');
    });
});

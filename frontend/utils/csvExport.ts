// CSV Export utilities for FlowFi

type CsvRow = Record<string, unknown>;

// Characters that spreadsheet apps (Excel, Google Sheets, LibreOffice) treat
// as the start of a formula. Cells beginning with any of these can execute as
// formulas when the CSV is opened — a CSV/formula injection vector.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

const escapeCsvCell = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    let text = value instanceof Date ? value.toLocaleString() : String(value);

    // Neutralize formula injection by prefixing a single quote so the cell is
    // always treated as text rather than an executable formula.
    if (text.length > 0 && FORMULA_TRIGGERS.includes(text[0])) {
        text = `'${text}`;
    }

    const escaped = text.replace(/"/g, '""');

    return /("|,|\n)/.test(escaped) ? `"${escaped}"` : escaped;
};

export const convertArrayToCSV = <T extends CsvRow>(
    arr: T[] | null | undefined
): string => {
    if (!arr || arr.length === 0) return '';

    const separator = ',';
    const keys = Object.keys(arr[0]);

    return [
        keys.join(separator),
        ...arr.map((row) =>
            keys.map((key) => escapeCsvCell(row[key])).join(separator)
        ),
    ].join('\n');
};

export const downloadCSV = <T extends CsvRow>(data: T[], filename: string) => {
    const csvData = convertArrayToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

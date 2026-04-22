export async function handleSheetsList(drive, params) {
    const safeFolderId = (params.folderId ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const q = params.folderId
        ? `mimeType='application/vnd.google-apps.spreadsheet' and '${safeFolderId}' in parents and trashed=false`
        : `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
    const res = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 100 });
    const files = res.data.files ?? [];
    if (files.length === 0)
        return "No spreadsheets found.";
    return files.map((f) => `${f.name} — id: ${f.id}\n  ${f.webViewLink}`).join("\n");
}
export async function handleSheetsGet(sheets, params) {
    const rangeStr = params.range ? `${params.sheet}!${params.range}` : params.sheet;
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: params.spreadsheetId,
        range: rangeStr,
    });
    return JSON.stringify(res.data.values ?? []);
}
export async function handleSheetsUpdate(sheets, params) {
    const res = await sheets.spreadsheets.values.update({
        spreadsheetId: params.spreadsheetId,
        range: `${params.sheet}!${params.range}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: params.values },
    });
    return `Updated ${res.data.updatedRange} — ${res.data.updatedCells} cells changed.`;
}
export async function handleSheetsCreate(sheets, params) {
    const res = await sheets.spreadsheets.create({
        requestBody: { properties: { title: params.title } },
    });
    return `Created: ${res.data.spreadsheetId}\nURL: ${res.data.spreadsheetUrl}`;
}
export async function handleSheetsListSheets(sheets, params) {
    const res = await sheets.spreadsheets.get({
        spreadsheetId: params.spreadsheetId,
        fields: "sheets.properties",
    });
    return (res.data.sheets ?? [])
        .map((s) => `${s.properties?.title} (sheetId: ${s.properties?.sheetId})`)
        .join("\n");
}
export async function handleSheetsAppend(sheets, params) {
    const res = await sheets.spreadsheets.values.append({
        spreadsheetId: params.spreadsheetId,
        range: params.sheet,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: params.values },
    });
    const u = res.data.updates;
    return `Appended to ${u?.updatedRange} — ${u?.updatedCells} cells written.`;
}
export async function handleSheetsClear(sheets, params) {
    const res = await sheets.spreadsheets.values.clear({
        spreadsheetId: params.spreadsheetId,
        range: `${params.sheet}!${params.range}`,
    });
    return `Cleared range ${res.data.clearedRange}.`;
}
export async function handleSheetsAddSheet(sheets, params) {
    const res = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
            requests: [{ addSheet: { properties: { title: params.title } } }],
        },
    });
    const added = res.data.replies?.[0]?.addSheet?.properties;
    return `Added sheet "${added?.title}" (sheetId: ${added?.sheetId}).`;
}
export async function handleSheetsDeleteSheet(sheets, params) {
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
            requests: [{ deleteSheet: { sheetId: params.sheetId } }],
        },
    });
    return `Deleted sheet ${params.sheetId}.`;
}
export async function handleSheetsCopyTo(sheets, params) {
    const res = await sheets.spreadsheets.sheets.copyTo({
        spreadsheetId: params.spreadsheetId,
        sheetId: params.sheetId,
        requestBody: { destinationSpreadsheetId: params.destinationSpreadsheetId },
    });
    return `Copied to sheet "${res.data.title}" (sheetId: ${res.data.sheetId}) in ${params.destinationSpreadsheetId}.`;
}
function hexToRgb(hex) {
    const clean = hex.replace(/^#/, "");
    const num = parseInt(clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean, 16);
    return {
        red: ((num >> 16) & 255) / 255,
        green: ((num >> 8) & 255) / 255,
        blue: (num & 255) / 255,
    };
}
function parseA1Range(range) {
    const colLetters = (s) => {
        let n = 0;
        for (const c of s.toUpperCase())
            n = n * 26 + (c.charCodeAt(0) - 64);
        return n - 1;
    };
    const m = range.match(/^([A-Za-z]+)(\d+)(?::([A-Za-z]+)(\d+))?$/);
    if (!m)
        throw new Error(`Invalid A1 range: ${range}`);
    const startCol = colLetters(m[1]);
    const startRow = parseInt(m[2]) - 1;
    const endCol = m[3] ? colLetters(m[3]) + 1 : startCol + 1;
    const endRow = m[4] ? parseInt(m[4]) : startRow + 1;
    return { startRowIndex: startRow, endRowIndex: endRow, startColumnIndex: startCol, endColumnIndex: endCol };
}
export async function handleSheetsFormatCells(sheets, params) {
    const gridRange = { sheetId: params.sheetId, ...parseA1Range(params.range) };
    const format = {};
    const fields = [];
    if (params.backgroundColor) {
        format.backgroundColor = hexToRgb(params.backgroundColor);
        fields.push("userEnteredFormat.backgroundColor");
    }
    if (params.textColor) {
        format.textFormat = { ...(format.textFormat ?? {}), foregroundColor: hexToRgb(params.textColor) };
        fields.push("userEnteredFormat.textFormat.foregroundColor");
    }
    if (params.bold !== undefined) {
        format.textFormat = { ...(format.textFormat ?? {}), bold: params.bold };
        fields.push("userEnteredFormat.textFormat.bold");
    }
    if (params.fontSize !== undefined) {
        format.textFormat = { ...(format.textFormat ?? {}), fontSize: params.fontSize };
        fields.push("userEnteredFormat.textFormat.fontSize");
    }
    if (fields.length === 0)
        return "No formatting options provided.";
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
            requests: [{
                    repeatCell: {
                        range: gridRange,
                        cell: { userEnteredFormat: format },
                        fields: fields.join(","),
                    },
                }],
        },
    });
    return `Formatted range ${params.range} on sheet ${params.sheetId}.`;
}
export async function handleSheetsBatchUpdate(sheets, params) {
    const data = params.updates.map((u) => ({
        range: `${u.sheet}!${u.range}`,
        values: u.values,
    }));
    const res = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: { valueInputOption: "USER_ENTERED", data },
    });
    return `Batch updated ${res.data.totalUpdatedCells} cells across ${res.data.totalUpdatedSheets} sheet(s).`;
}

import type { sheets_v4, drive_v3 } from "googleapis";

export async function handleSheetsList(
  drive: drive_v3.Drive,
  params: { folderId?: string }
): Promise<string> {
  const safeFolderId = (params.folderId ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = params.folderId
    ? `mimeType='application/vnd.google-apps.spreadsheet' and '${safeFolderId}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const res = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 100 });
  const files = res.data.files ?? [];
  if (files.length === 0) return "No spreadsheets found.";
  return files.map((f) => `${f.name} — id: ${f.id}\n  ${f.webViewLink}`).join("\n");
}

export async function handleSheetsGet(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; sheet: string; range?: string }
): Promise<string> {
  const rangeStr = params.range ? `${params.sheet}!${params.range}` : params.sheet;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: params.spreadsheetId,
    range: rangeStr,
  });
  return JSON.stringify(res.data.values ?? []);
}

export async function handleSheetsUpdate(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; sheet: string; range: string; values: unknown[][] }
): Promise<string> {
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: params.spreadsheetId,
    range: `${params.sheet}!${params.range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: params.values },
  });
  return `Updated ${res.data.updatedRange} — ${res.data.updatedCells} cells changed.`;
}

export async function handleSheetsCreate(
  sheets: sheets_v4.Sheets,
  params: { title: string }
): Promise<string> {
  const res = await sheets.spreadsheets.create({
    requestBody: { properties: { title: params.title } },
  });
  return `Created: ${res.data.spreadsheetId}\nURL: ${res.data.spreadsheetUrl}`;
}

export async function handleSheetsListSheets(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string }
): Promise<string> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: params.spreadsheetId,
    fields: "sheets.properties",
  });
  return (res.data.sheets ?? [])
    .map((s) => `${s.properties?.title} (sheetId: ${s.properties?.sheetId})`)
    .join("\n");
}

export async function handleSheetsAppend(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; sheet: string; values: unknown[][] }
): Promise<string> {
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: params.spreadsheetId,
    range: params.sheet,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: params.values },
  });
  const u = res.data.updates;
  return `Appended to ${u?.updatedRange} — ${u?.updatedCells} cells written.`;
}

export async function handleSheetsClear(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; sheet: string; range: string }
): Promise<string> {
  const res = await sheets.spreadsheets.values.clear({
    spreadsheetId: params.spreadsheetId,
    range: `${params.sheet}!${params.range}`,
  });
  return `Cleared range ${res.data.clearedRange}.`;
}

export async function handleSheetsAddSheet(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; title: string }
): Promise<string> {
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: params.spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: params.title } } }],
    },
  });
  const added = res.data.replies?.[0]?.addSheet?.properties;
  return `Added sheet "${added?.title}" (sheetId: ${added?.sheetId}).`;
}

export async function handleSheetsDeleteSheet(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; sheetId: number }
): Promise<string> {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: params.spreadsheetId,
    requestBody: {
      requests: [{ deleteSheet: { sheetId: params.sheetId } }],
    },
  });
  return `Deleted sheet ${params.sheetId}.`;
}

export async function handleSheetsCopyTo(
  sheets: sheets_v4.Sheets,
  params: { spreadsheetId: string; sheetId: number; destinationSpreadsheetId: string }
): Promise<string> {
  const res = await sheets.spreadsheets.sheets.copyTo({
    spreadsheetId: params.spreadsheetId,
    sheetId: params.sheetId,
    requestBody: { destinationSpreadsheetId: params.destinationSpreadsheetId },
  });
  return `Copied to sheet "${res.data.title}" (sheetId: ${res.data.sheetId}) in ${params.destinationSpreadsheetId}.`;
}

export async function handleSheetsBatchUpdate(
  sheets: sheets_v4.Sheets,
  params: {
    spreadsheetId: string;
    updates: Array<{ sheet: string; range: string; values: unknown[][] }>;
  }
): Promise<string> {
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

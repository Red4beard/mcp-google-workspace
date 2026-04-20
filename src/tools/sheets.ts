export const sheetsTools = [
  {
    name: "sheets_list",
    description: "List Google Sheets spreadsheets accessible to the Service Account, optionally filtered by Drive folder",
    inputSchema: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Drive folder ID (optional — lists all accessible if omitted)" },
      },
    },
  },
  {
    name: "sheets_get",
    description: "Read cell data from a spreadsheet range",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        sheet: { type: "string", description: "Sheet tab name (e.g. Sheet1)" },
        range: { type: "string", description: "A1 notation range (e.g. A1:C10). Omit to read entire sheet." },
      },
      required: ["spreadsheetId", "sheet"],
    },
  },
  {
    name: "sheets_update",
    description: "Write or update cells in a spreadsheet range",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        sheet: { type: "string" },
        range: { type: "string", description: "A1 notation range (e.g. A1:C3)" },
        values: { type: "array", description: "2D array of values", items: { type: "array" } },
      },
      required: ["spreadsheetId", "sheet", "range", "values"],
    },
  },
  {
    name: "sheets_create",
    description: "Create a new Google Sheets spreadsheet",
    inputSchema: {
      type: "object",
      properties: { title: { type: "string" } },
      required: ["title"],
    },
  },
  {
    name: "sheets_list_sheets",
    description: "List all sheet tabs in a spreadsheet",
    inputSchema: {
      type: "object",
      properties: { spreadsheetId: { type: "string" } },
      required: ["spreadsheetId"],
    },
  },
  {
    name: "sheets_append",
    description: "Append rows to the end of a sheet",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        sheet: { type: "string" },
        values: { type: "array", description: "2D array of rows", items: { type: "array" } },
      },
      required: ["spreadsheetId", "sheet", "values"],
    },
  },
  {
    name: "sheets_clear",
    description: "Clear a cell range in a sheet",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        sheet: { type: "string" },
        range: { type: "string", description: "A1 notation range to clear" },
      },
      required: ["spreadsheetId", "sheet", "range"],
    },
  },
  {
    name: "sheets_add_sheet",
    description: "Add a new sheet tab to a spreadsheet",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        title: { type: "string", description: "New sheet tab name" },
      },
      required: ["spreadsheetId", "title"],
    },
  },
  {
    name: "sheets_delete_sheet",
    description: "Delete a sheet tab by sheetId (use sheets_list_sheets to find sheetId)",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        sheetId: { type: "number" },
      },
      required: ["spreadsheetId", "sheetId"],
    },
  },
  {
    name: "sheets_copy_to",
    description: "Copy a sheet tab to another spreadsheet",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string", description: "Source spreadsheet ID" },
        sheetId: { type: "number", description: "Source sheet tab ID" },
        destinationSpreadsheetId: { type: "string", description: "Target spreadsheet ID" },
      },
      required: ["spreadsheetId", "sheetId", "destinationSpreadsheetId"],
    },
  },
  {
    name: "sheets_batch_update",
    description: "Update multiple cell ranges in one request",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        updates: {
          type: "array",
          description: "Array of range updates",
          items: {
            type: "object",
            properties: {
              sheet: { type: "string" },
              range: { type: "string" },
              values: { type: "array", items: { type: "array" } },
            },
            required: ["sheet", "range", "values"],
          },
        },
      },
      required: ["spreadsheetId", "updates"],
    },
  },
] as const;

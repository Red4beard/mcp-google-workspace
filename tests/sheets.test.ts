import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleSheetsList,
  handleSheetsGet,
  handleSheetsUpdate,
  handleSheetsCreate,
  handleSheetsListSheets,
  handleSheetsAppend,
  handleSheetsClear,
  handleSheetsAddSheet,
  handleSheetsDeleteSheet,
  handleSheetsCopyTo,
  handleSheetsBatchUpdate,
} from "../src/index.js";

const mockSheets: any = {
  spreadsheets: {
    values: {
      get: vi.fn(),
      update: vi.fn(),
      append: vi.fn(),
      clear: vi.fn(),
      batchUpdate: vi.fn(),
    },
    get: vi.fn(),
    create: vi.fn(),
    batchUpdate: vi.fn(),
    sheets: { copyTo: vi.fn() },
  },
};

const mockDrive: any = {
  files: { list: vi.fn() },
};

beforeEach(() => vi.clearAllMocks());

describe("handleSheetsList", () => {
  it("returns spreadsheet names and ids", async () => {
    mockDrive.files.list.mockResolvedValue({
      data: { files: [{ id: "abc", name: "Test Plan", webViewLink: "https://docs.google.com/abc" }] },
    });
    const result = await handleSheetsList(mockDrive, {});
    expect(result).toContain("Test Plan");
    expect(result).toContain("abc");
  });

  it("returns 'No spreadsheets found' when list is empty", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    const result = await handleSheetsList(mockDrive, {});
    expect(result).toBe("No spreadsheets found.");
  });

  it("includes folderId in query when provided", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    await handleSheetsList(mockDrive, { folderId: "folder1" });
    const callArg = mockDrive.files.list.mock.calls[0][0];
    expect(callArg.q).toContain("'folder1' in parents");
  });
});

describe("handleSheetsGet", () => {
  it("returns values as JSON", async () => {
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: { values: [["Name", "Status"], ["TC-1", "Pass"]] },
    });
    const result = await handleSheetsGet(mockSheets, { spreadsheetId: "id1", sheet: "Sheet1" });
    expect(JSON.parse(result)).toEqual([["Name", "Status"], ["TC-1", "Pass"]]);
  });

  it("returns empty array when sheet has no data", async () => {
    mockSheets.spreadsheets.values.get.mockResolvedValue({ data: {} });
    const result = await handleSheetsGet(mockSheets, { spreadsheetId: "id1", sheet: "Sheet1" });
    expect(JSON.parse(result)).toEqual([]);
  });

  it("uses range in A1 notation when provided", async () => {
    mockSheets.spreadsheets.values.get.mockResolvedValue({ data: { values: [["A"]] } });
    await handleSheetsGet(mockSheets, { spreadsheetId: "id1", sheet: "Sheet1", range: "A1:B2" });
    expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith(
      expect.objectContaining({ range: "Sheet1!A1:B2" })
    );
  });

  it("uses sheet name only when no range provided", async () => {
    mockSheets.spreadsheets.values.get.mockResolvedValue({ data: { values: [] } });
    await handleSheetsGet(mockSheets, { spreadsheetId: "id1", sheet: "MySheet" });
    expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith(
      expect.objectContaining({ range: "MySheet" })
    );
  });
});

describe("handleSheetsUpdate", () => {
  it("returns updated range and cell count", async () => {
    mockSheets.spreadsheets.values.update.mockResolvedValue({
      data: { updatedRange: "Sheet1!A1:B2", updatedCells: 4 },
    });
    const result = await handleSheetsUpdate(mockSheets, {
      spreadsheetId: "id1", sheet: "Sheet1", range: "A1:B2",
      values: [["Pass", "2026-04-19"], ["Fail", "2026-04-19"]],
    });
    expect(result).toContain("Sheet1!A1:B2");
    expect(result).toContain("4");
  });

  it("uses USER_ENTERED value input option", async () => {
    mockSheets.spreadsheets.values.update.mockResolvedValue({
      data: { updatedRange: "Sheet1!A1", updatedCells: 1 },
    });
    await handleSheetsUpdate(mockSheets, {
      spreadsheetId: "id1", sheet: "Sheet1", range: "A1", values: [["x"]],
    });
    expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith(
      expect.objectContaining({ valueInputOption: "USER_ENTERED" })
    );
  });
});

describe("handleSheetsCreate", () => {
  it("returns spreadsheet id and url", async () => {
    mockSheets.spreadsheets.create.mockResolvedValue({
      data: { spreadsheetId: "new123", spreadsheetUrl: "https://docs.google.com/spreadsheets/d/new123" },
    });
    const result = await handleSheetsCreate(mockSheets, { title: "QA Plan" });
    expect(result).toContain("new123");
    expect(result).toContain("https://docs.google.com");
  });
});

describe("handleSheetsListSheets", () => {
  it("returns sheet names and ids", async () => {
    mockSheets.spreadsheets.get.mockResolvedValue({
      data: {
        sheets: [
          { properties: { sheetId: 0, title: "Sheet1" } },
          { properties: { sheetId: 1, title: "Results" } },
        ],
      },
    });
    const result = await handleSheetsListSheets(mockSheets, { spreadsheetId: "id1" });
    expect(result).toContain("Sheet1");
    expect(result).toContain("Results");
    expect(result).toContain("sheetId: 0");
  });
});

describe("handleSheetsAppend", () => {
  it("returns updated range and cell count", async () => {
    mockSheets.spreadsheets.values.append.mockResolvedValue({
      data: { updates: { updatedRange: "Sheet1!A5:C5", updatedCells: 3 } },
    });
    const result = await handleSheetsAppend(mockSheets, {
      spreadsheetId: "id1", sheet: "Sheet1", values: [["TC-5", "Pass", "2026-04-19"]],
    });
    expect(result).toContain("A5:C5");
    expect(result).toContain("3");
  });
});

describe("handleSheetsClear", () => {
  it("returns cleared range", async () => {
    mockSheets.spreadsheets.values.clear.mockResolvedValue({
      data: { clearedRange: "Sheet1!A1:Z100" },
    });
    const result = await handleSheetsClear(mockSheets, {
      spreadsheetId: "id1", sheet: "Sheet1", range: "A1:Z100",
    });
    expect(result).toContain("Sheet1!A1:Z100");
  });
});

describe("handleSheetsAddSheet", () => {
  it("returns new sheet name and id", async () => {
    mockSheets.spreadsheets.batchUpdate.mockResolvedValue({
      data: { replies: [{ addSheet: { properties: { title: "Results", sheetId: 5 } } }] },
    });
    const result = await handleSheetsAddSheet(mockSheets, { spreadsheetId: "id1", title: "Results" });
    expect(result).toContain("Results");
    expect(result).toContain("5");
  });
});

describe("handleSheetsDeleteSheet", () => {
  it("confirms deletion with sheet id", async () => {
    mockSheets.spreadsheets.batchUpdate.mockResolvedValue({ data: {} });
    const result = await handleSheetsDeleteSheet(mockSheets, { spreadsheetId: "id1", sheetId: 5 });
    expect(result).toContain("5");
  });
});

describe("handleSheetsCopyTo", () => {
  it("returns destination sheet info", async () => {
    mockSheets.spreadsheets.sheets.copyTo.mockResolvedValue({
      data: { title: "Copy of Sheet1", sheetId: 99 },
    });
    const result = await handleSheetsCopyTo(mockSheets, {
      spreadsheetId: "src", sheetId: 0, destinationSpreadsheetId: "dst",
    });
    expect(result).toContain("Copy of Sheet1");
    expect(result).toContain("99");
  });
});

describe("handleSheetsBatchUpdate", () => {
  it("returns total cells and sheets updated", async () => {
    mockSheets.spreadsheets.values.batchUpdate.mockResolvedValue({
      data: { totalUpdatedCells: 12, totalUpdatedSheets: 2 },
    });
    const result = await handleSheetsBatchUpdate(mockSheets, {
      spreadsheetId: "id1",
      updates: [
        { sheet: "Sheet1", range: "A1:C2", values: [["a", "b", "c"]] },
        { sheet: "Results", range: "A1:C2", values: [["x", "y", "z"]] },
      ],
    });
    expect(result).toContain("12");
    expect(result).toContain("2");
  });
});

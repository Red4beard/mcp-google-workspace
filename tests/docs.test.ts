import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleDocsGet,
  handleDocsCreate,
  handleDocsAppend,
  handleDocsUpdate,
  handleDocsGetRaw,
  handleDocsInsertTable,
  handleDocsExport,
} from "../src/index.js";

const mockDocs: any = {
  documents: {
    get: vi.fn(),
    create: vi.fn(),
    batchUpdate: vi.fn(),
  },
};

const mockDrive: any = {
  files: {
    export: vi.fn(),
  },
};

beforeEach(() => vi.clearAllMocks());

describe("handleDocsGet", () => {
  it("returns paragraph text content", async () => {
    mockDocs.documents.get.mockResolvedValue({
      data: {
        body: {
          content: [
            { paragraph: { elements: [{ textRun: { content: "Hello " } }] } },
            { paragraph: { elements: [{ textRun: { content: "World\n" } }] } },
          ],
        },
      },
    });
    const result = await handleDocsGet(mockDocs, { documentId: "doc1" });
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("returns table cell text content", async () => {
    mockDocs.documents.get.mockResolvedValue({
      data: {
        body: {
          content: [
            {
              table: {
                tableRows: [
                  {
                    tableCells: [
                      {
                        content: [
                          { paragraph: { elements: [{ textRun: { content: "Cell A" } }] } },
                        ],
                      },
                      {
                        content: [
                          { paragraph: { elements: [{ textRun: { content: "Cell B" } }] } },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    const result = await handleDocsGet(mockDocs, { documentId: "doc1" });
    expect(result).toContain("Cell A");
    expect(result).toContain("Cell B");
  });

  it("returns empty string for empty document", async () => {
    mockDocs.documents.get.mockResolvedValue({ data: { body: { content: [] } } });
    const result = await handleDocsGet(mockDocs, { documentId: "doc1" });
    expect(result).toBe("");
  });
});

describe("handleDocsCreate", () => {
  it("returns document id and url", async () => {
    mockDocs.documents.create.mockResolvedValue({ data: { documentId: "newdoc1" } });
    const result = await handleDocsCreate(mockDocs, { title: "QA Report" });
    expect(result).toContain("newdoc1");
    expect(result).toContain("docs.google.com/document/d/newdoc1");
  });
});

describe("handleDocsAppend", () => {
  it("appends text and returns char count", async () => {
    mockDocs.documents.get.mockResolvedValue({
      data: { body: { content: [{ endIndex: 10 }] } },
    });
    mockDocs.documents.batchUpdate.mockResolvedValue({ data: {} });
    const result = await handleDocsAppend(mockDocs, { documentId: "doc1", text: "New paragraph\n" });
    expect(result).toContain("14");
  });

  it("uses endIndex - 1 for insertion point", async () => {
    mockDocs.documents.get.mockResolvedValue({
      data: { body: { content: [{ endIndex: 5 }] } },
    });
    mockDocs.documents.batchUpdate.mockResolvedValue({ data: {} });
    await handleDocsAppend(mockDocs, { documentId: "doc1", text: "hi" });
    const req = mockDocs.documents.batchUpdate.mock.calls[0][0];
    expect(req.requestBody.requests[0].insertText.location.index).toBe(4);
  });
});

describe("handleDocsUpdate", () => {
  it("returns occurrence count", async () => {
    mockDocs.documents.batchUpdate.mockResolvedValue({
      data: { replies: [{ replaceAllText: { occurrencesChanged: 3 } }] },
    });
    const result = await handleDocsUpdate(mockDocs, {
      documentId: "doc1", searchText: "DRAFT", replaceText: "FINAL",
    });
    expect(result).toContain("3");
    expect(result).toContain("DRAFT");
    expect(result).toContain("FINAL");
  });

  it("returns 0 when no occurrences found", async () => {
    mockDocs.documents.batchUpdate.mockResolvedValue({
      data: { replies: [{ replaceAllText: {} }] },
    });
    const result = await handleDocsUpdate(mockDocs, {
      documentId: "doc1", searchText: "MISSING", replaceText: "X",
    });
    expect(result).toContain("0");
  });
});

describe("handleDocsGetRaw", () => {
  it("returns JSON string of document", async () => {
    const doc = { documentId: "doc1", title: "Test", body: {} };
    mockDocs.documents.get.mockResolvedValue({ data: doc });
    const result = await handleDocsGetRaw(mockDocs, { documentId: "doc1" });
    expect(JSON.parse(result)).toMatchObject({ documentId: "doc1" });
  });
});

describe("handleDocsInsertTable", () => {
  it("confirms table insertion with dimensions", async () => {
    mockDocs.documents.batchUpdate.mockResolvedValue({ data: {} });
    const result = await handleDocsInsertTable(mockDocs, { documentId: "doc1", rows: 3, columns: 4 });
    expect(result).toContain("3×4");
  });

  it("uses index 1 as default insertion point", async () => {
    mockDocs.documents.batchUpdate.mockResolvedValue({ data: {} });
    await handleDocsInsertTable(mockDocs, { documentId: "doc1", rows: 2, columns: 2 });
    const req = mockDocs.documents.batchUpdate.mock.calls[0][0];
    expect(req.requestBody.requests[0].insertTable.location.index).toBe(1);
  });
});

describe("handleDocsExport", () => {
  it("returns plain text for txt format", async () => {
    const textContent = "Document content as plain text";
    mockDrive.files.export.mockResolvedValue({
      data: Buffer.from(textContent),
    });
    const result = await handleDocsExport(mockDrive, { documentId: "doc1", format: "txt" });
    expect(result).toContain("Document content");
  });

  it("returns base64 prefix for pdf format", async () => {
    mockDrive.files.export.mockResolvedValue({
      data: Buffer.from("PDF binary data"),
    });
    const result = await handleDocsExport(mockDrive, { documentId: "doc1", format: "pdf" });
    expect(result).toMatch(/^base64:/);
  });

  it("returns base64 prefix for docx format", async () => {
    mockDrive.files.export.mockResolvedValue({
      data: Buffer.from("DOCX binary data"),
    });
    const result = await handleDocsExport(mockDrive, { documentId: "doc1", format: "docx" });
    expect(result).toMatch(/^base64:/);
  });
});

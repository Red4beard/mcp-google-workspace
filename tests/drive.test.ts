import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleDriveList,
  handleDriveSearch,
  handleDriveGet,
  handleDriveCreateFolder,
  handleDriveRename,
  handleDriveShare,
  handleDriveCopy,
  handleDriveMove,
  handleDriveDelete,
} from "../src/index.js";

const mockDrive: any = {
  files: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    copy: vi.fn(),
    export: vi.fn(),
  },
  permissions: { create: vi.fn() },
};

beforeEach(() => vi.clearAllMocks());

describe("handleDriveList", () => {
  it("returns file names and ids", async () => {
    mockDrive.files.list.mockResolvedValue({
      data: { files: [{ id: "f1", name: "TestPlan.xlsx", mimeType: "application/vnd.ms-excel" }] },
    });
    const result = await handleDriveList(mockDrive, { folderId: "folder1" });
    expect(result).toContain("TestPlan.xlsx");
    expect(result).toContain("f1");
  });

  it("returns 'Folder is empty' when no files", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    const result = await handleDriveList(mockDrive, {});
    expect(result).toBe("Folder is empty.");
  });

  it("queries root when no folderId provided", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    await handleDriveList(mockDrive, {});
    const callArg = mockDrive.files.list.mock.calls[0][0];
    expect(callArg.q).toContain("'root' in parents");
  });
});

describe("handleDriveSearch", () => {
  it("returns matching files", async () => {
    mockDrive.files.list.mockResolvedValue({
      data: { files: [{ id: "x1", name: "ESGI Test Plan", mimeType: "application/pdf", webViewLink: "https://drive.google.com/x1" }] },
    });
    const result = await handleDriveSearch(mockDrive, { query: "ESGI" });
    expect(result).toContain("ESGI Test Plan");
    expect(result).toContain("x1");
  });

  it("returns 'No files found' on empty results", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    const result = await handleDriveSearch(mockDrive, { query: "nonexistent" });
    expect(result).toContain("No files found");
  });

  it("escapes single quotes in query", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    await handleDriveSearch(mockDrive, { query: "O'Brien" });
    const callArg = mockDrive.files.list.mock.calls[0][0];
    expect(callArg.q).toContain("O\\'Brien");
  });

  it("adds folderId filter when provided", async () => {
    mockDrive.files.list.mockResolvedValue({ data: { files: [] } });
    await handleDriveSearch(mockDrive, { query: "test", folderId: "folder1" });
    const callArg = mockDrive.files.list.mock.calls[0][0];
    expect(callArg.q).toContain("'folder1' in parents");
  });
});

describe("handleDriveGet", () => {
  it("returns file metadata", async () => {
    mockDrive.files.get.mockResolvedValue({
      data: {
        id: "f1", name: "Report.pdf", mimeType: "application/pdf",
        size: "204800", createdTime: "2026-04-01T00:00:00Z",
        modifiedTime: "2026-04-19T00:00:00Z",
        webViewLink: "https://drive.google.com/f1", parents: ["parent1"],
      },
    });
    const result = await handleDriveGet(mockDrive, { fileId: "f1" });
    expect(result).toContain("Report.pdf");
    expect(result).toContain("200 KB");
    expect(result).toContain("parent1");
  });

  it("shows N/A for size when not available", async () => {
    mockDrive.files.get.mockResolvedValue({
      data: { id: "f1", name: "Doc", mimeType: "application/vnd.google-apps.document" },
    });
    const result = await handleDriveGet(mockDrive, { fileId: "f1" });
    expect(result).toContain("N/A");
  });
});

describe("handleDriveCreateFolder", () => {
  it("returns new folder id and url", async () => {
    mockDrive.files.create.mockResolvedValue({
      data: { id: "fold1", name: "QA Reports", webViewLink: "https://drive.google.com/fold1" },
    });
    const result = await handleDriveCreateFolder(mockDrive, { name: "QA Reports" });
    expect(result).toContain("QA Reports");
    expect(result).toContain("fold1");
  });

  it("passes parentId when provided", async () => {
    mockDrive.files.create.mockResolvedValue({
      data: { id: "f1", name: "Sub", webViewLink: "" },
    });
    await handleDriveCreateFolder(mockDrive, { name: "Sub", parentId: "parent1" });
    const callArg = mockDrive.files.create.mock.calls[0][0];
    expect(callArg.requestBody.parents).toContain("parent1");
  });
});

describe("handleDriveRename", () => {
  it("returns new name", async () => {
    mockDrive.files.update.mockResolvedValue({ data: { id: "f1", name: "NewName.pdf" } });
    const result = await handleDriveRename(mockDrive, { fileId: "f1", newName: "NewName.pdf" });
    expect(result).toContain("NewName.pdf");
  });
});

describe("handleDriveShare", () => {
  it("confirms sharing", async () => {
    mockDrive.permissions.create.mockResolvedValue({ data: {} });
    const result = await handleDriveShare(mockDrive, {
      fileId: "f1", email: "user@example.com", role: "writer",
    });
    expect(result).toContain("user@example.com");
    expect(result).toContain("writer");
  });
});

describe("handleDriveCopy", () => {
  it("returns copy id and url", async () => {
    mockDrive.files.copy.mockResolvedValue({
      data: { id: "copy1", name: "Copy of Plan", webViewLink: "https://drive.google.com/copy1" },
    });
    const result = await handleDriveCopy(mockDrive, { fileId: "f1", newName: "Copy of Plan" });
    expect(result).toContain("Copy of Plan");
    expect(result).toContain("copy1");
  });
});

describe("handleDriveMove", () => {
  it("confirms move with target folder", async () => {
    mockDrive.files.get.mockResolvedValue({ data: { parents: ["oldParent"] } });
    mockDrive.files.update.mockResolvedValue({ data: {} });
    const result = await handleDriveMove(mockDrive, { fileId: "f1", newParentId: "newParent" });
    expect(result).toContain("f1");
    expect(result).toContain("newParent");
  });
});

describe("handleDriveDelete", () => {
  it("confirms deletion", async () => {
    mockDrive.files.delete.mockResolvedValue({ data: {} });
    const result = await handleDriveDelete(mockDrive, { fileId: "f1" });
    expect(result).toContain("f1");
  });
});

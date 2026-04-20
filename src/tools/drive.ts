export const driveTools = [
  {
    name: "drive_list",
    description: "List files and folders in a Drive folder",
    inputSchema: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Folder ID (omit for root)" },
      },
    },
  },
  {
    name: "drive_search",
    description: "Search files in Drive by name, type, or parent folder",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text (matches file names)" },
        folderId: { type: "string", description: "Restrict search to this folder (optional)" },
        mimeType: { type: "string", description: "Filter by MIME type (optional)" },
      },
      required: ["query"],
    },
  },
  {
    name: "drive_get",
    description: "Get metadata of a Drive file (name, type, size, URL, etc.)",
    inputSchema: {
      type: "object",
      properties: { fileId: { type: "string" } },
      required: ["fileId"],
    },
  },
  {
    name: "drive_download",
    description: "Download file content. Google Workspace files (Docs/Sheets) are exported as text. Binary files return base64.",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        mimeType: { type: "string", description: "Export MIME type for Google Workspace files (default: text/plain)" },
      },
      required: ["fileId"],
    },
  },
  {
    name: "drive_create_folder",
    description: "Create a new folder in Drive",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        parentId: { type: "string", description: "Parent folder ID (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "drive_upload",
    description: "Upload a file to Drive. Pass content as plain text or base64: prefix for binary.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        content: { type: "string", description: "File content (text or base64: prefix)" },
        mimeType: { type: "string", description: "File MIME type" },
        parentId: { type: "string", description: "Parent folder ID (optional)" },
      },
      required: ["name", "content", "mimeType"],
    },
  },
  {
    name: "drive_move",
    description: "Move a file or folder to a different parent folder",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        newParentId: { type: "string" },
      },
      required: ["fileId", "newParentId"],
    },
  },
  {
    name: "drive_rename",
    description: "Rename a file or folder",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        newName: { type: "string" },
      },
      required: ["fileId", "newName"],
    },
  },
  {
    name: "drive_delete",
    description: "Permanently delete a file or folder",
    inputSchema: {
      type: "object",
      properties: { fileId: { type: "string" } },
      required: ["fileId"],
    },
  },
  {
    name: "drive_share",
    description: "Share a file with a user by email",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        email: { type: "string" },
        role: { type: "string", description: "Permission role: reader, commenter, writer, or owner" },
      },
      required: ["fileId", "email", "role"],
    },
  },
  {
    name: "drive_copy",
    description: "Copy a file in Drive",
    inputSchema: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        newName: { type: "string", description: "Name for the copy (optional)" },
        parentId: { type: "string", description: "Destination folder ID (optional)" },
      },
      required: ["fileId"],
    },
  },
] as const;

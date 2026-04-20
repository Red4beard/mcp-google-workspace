export const docsTools = [
    {
        name: "docs_get",
        description: "Read a Google Doc as plain text",
        inputSchema: {
            type: "object",
            properties: { documentId: { type: "string" } },
            required: ["documentId"],
        },
    },
    {
        name: "docs_create",
        description: "Create a new Google Doc",
        inputSchema: {
            type: "object",
            properties: { title: { type: "string" } },
            required: ["title"],
        },
    },
    {
        name: "docs_append",
        description: "Append text to the end of a Google Doc",
        inputSchema: {
            type: "object",
            properties: {
                documentId: { type: "string" },
                text: { type: "string" },
            },
            required: ["documentId", "text"],
        },
    },
    {
        name: "docs_update",
        description: "Find and replace text in a Google Doc",
        inputSchema: {
            type: "object",
            properties: {
                documentId: { type: "string" },
                searchText: { type: "string" },
                replaceText: { type: "string" },
            },
            required: ["documentId", "searchText", "replaceText"],
        },
    },
    {
        name: "docs_get_raw",
        description: "Get the full raw JSON structure of a Google Doc (for advanced use)",
        inputSchema: {
            type: "object",
            properties: { documentId: { type: "string" } },
            required: ["documentId"],
        },
    },
    {
        name: "docs_insert_table",
        description: "Insert a table into a Google Doc",
        inputSchema: {
            type: "object",
            properties: {
                documentId: { type: "string" },
                rows: { type: "number" },
                columns: { type: "number" },
                index: { type: "number", description: "Document index to insert at (default: 1 = beginning)" },
            },
            required: ["documentId", "rows", "columns"],
        },
    },
    {
        name: "docs_export",
        description: "Export a Google Doc as PDF, DOCX, or plain text",
        inputSchema: {
            type: "object",
            properties: {
                documentId: { type: "string" },
                format: { type: "string", description: "Export format: pdf, docx, or txt" },
            },
            required: ["documentId", "format"],
        },
    },
];

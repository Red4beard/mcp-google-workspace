#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { sheetsClient, driveClient, docsClient } from "./auth.js";
import { ok, err } from "./helpers.js";
import { sheetsTools } from "./tools/sheets.js";
import { driveTools } from "./tools/drive.js";
import { docsTools } from "./tools/docs.js";
export * from "./handlers/sheets.js";
export * from "./handlers/drive.js";
export * from "./handlers/docs.js";
import { handleSheetsList, handleSheetsGet, handleSheetsUpdate, handleSheetsCreate, handleSheetsListSheets, handleSheetsAppend, handleSheetsClear, handleSheetsAddSheet, handleSheetsDeleteSheet, handleSheetsCopyTo, handleSheetsBatchUpdate, handleSheetsFormatCells, } from "./handlers/sheets.js";
import { handleDriveList, handleDriveSearch, handleDriveGet, handleDriveDownload, handleDriveCreateFolder, handleDriveUpload, handleDriveMove, handleDriveRename, handleDriveDelete, handleDriveShare, handleDriveCopy, } from "./handlers/drive.js";
import { handleDocsGet, handleDocsCreate, handleDocsAppend, handleDocsUpdate, handleDocsGetRaw, handleDocsInsertTable, handleDocsExport, } from "./handlers/docs.js";
const server = new Server({ name: "mcp-google-workspace", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...sheetsTools, ...driveTools, ...docsTools],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {});
    try {
        switch (name) {
            // Sheets
            case "sheets_list": return ok(await handleSheetsList(driveClient, a));
            case "sheets_get": return ok(await handleSheetsGet(sheetsClient, a));
            case "sheets_update": return ok(await handleSheetsUpdate(sheetsClient, a));
            case "sheets_create": return ok(await handleSheetsCreate(sheetsClient, a));
            case "sheets_list_sheets": return ok(await handleSheetsListSheets(sheetsClient, a));
            case "sheets_append": return ok(await handleSheetsAppend(sheetsClient, a));
            case "sheets_clear": return ok(await handleSheetsClear(sheetsClient, a));
            case "sheets_add_sheet": return ok(await handleSheetsAddSheet(sheetsClient, a));
            case "sheets_delete_sheet": return ok(await handleSheetsDeleteSheet(sheetsClient, a));
            case "sheets_copy_to": return ok(await handleSheetsCopyTo(sheetsClient, a));
            case "sheets_batch_update": return ok(await handleSheetsBatchUpdate(sheetsClient, a));
            case "sheets_format_cells": return ok(await handleSheetsFormatCells(sheetsClient, a));
            // Drive
            case "drive_list": return ok(await handleDriveList(driveClient, a));
            case "drive_search": return ok(await handleDriveSearch(driveClient, a));
            case "drive_get": return ok(await handleDriveGet(driveClient, a));
            case "drive_download": return ok(await handleDriveDownload(driveClient, a));
            case "drive_create_folder": return ok(await handleDriveCreateFolder(driveClient, a));
            case "drive_upload": return ok(await handleDriveUpload(driveClient, a));
            case "drive_move": return ok(await handleDriveMove(driveClient, a));
            case "drive_rename": return ok(await handleDriveRename(driveClient, a));
            case "drive_delete": return ok(await handleDriveDelete(driveClient, a));
            case "drive_share": return ok(await handleDriveShare(driveClient, a));
            case "drive_copy": return ok(await handleDriveCopy(driveClient, a));
            // Docs
            case "docs_get": return ok(await handleDocsGet(docsClient, a));
            case "docs_create": return ok(await handleDocsCreate(docsClient, a));
            case "docs_append": return ok(await handleDocsAppend(docsClient, a));
            case "docs_update": return ok(await handleDocsUpdate(docsClient, a));
            case "docs_get_raw": return ok(await handleDocsGetRaw(docsClient, a));
            case "docs_insert_table": return ok(await handleDocsInsertTable(docsClient, a));
            case "docs_export": return ok(await handleDocsExport(driveClient, a));
            default:
                return err(new Error(`Unknown tool: ${name}`));
        }
    }
    catch (error) {
        return err(error);
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);

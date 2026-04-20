# mcp-google-workspace

MCP server for Google Workspace — gives Claude Code direct access to **Google Sheets**, **Google Drive**, and **Google Docs** via Service Account authentication. No third-party intermediaries: your data goes from Claude Code to your local machine to Google's API and back.

## Requirements

- Node.js 18+
- A Google Cloud Service Account JSON key with Sheets, Drive, and Docs APIs enabled

## Setup

### 1. Get a Service Account JSON key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable these APIs under **APIs & Services → Enable APIs**:
   - Google Sheets API
   - Google Drive API
   - Google Docs API
3. Go to **IAM & Admin → Service Accounts → Create**
4. Name it (e.g. `mcp-workspace`), skip role assignment, click Done
5. Click the account → **Keys → Add Key → Create new key → JSON** → download
6. Save the JSON to `~/.config/gcp/sa.json` (or any path you choose)

### 2. Share your files with the Service Account

The Service Account is like a separate Google user. It can only access files shared with it.

1. Open any Google Sheet, Drive folder, or Doc you want Claude to access
2. Click **Share**
3. Paste the `client_email` from your SA JSON (e.g. `mcp-workspace@your-project.iam.gserviceaccount.com`)
4. Set role to **Editor**

### 3. Add to .mcp.json

In your project root (or `~/.claude/`), add to `.mcp.json`:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "github:Red4beard/mcp-google-workspace"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/Users/YOUR_NAME/.config/gcp/sa.json"
      }
    }
  }
}
```

Replace `/Users/YOUR_NAME/.config/gcp/sa.json` with the actual path to your JSON key.

Restart Claude Code. The server starts automatically.

### 4. Verify

Ask Claude: *"List my accessible Google Sheets"*

## Updating

```bash
npx clear-npx-cache
```

## Tools Reference

### Google Sheets (11 tools)

| Tool | Description |
|---|---|
| `sheets_list` | List spreadsheets, optionally filtered by Drive folder |
| `sheets_get` | Read cell data from a range (A1 notation) |
| `sheets_update` | Write or update cells in a range |
| `sheets_create` | Create a new spreadsheet |
| `sheets_list_sheets` | List all sheet tabs |
| `sheets_append` | Append rows to the end of a sheet |
| `sheets_clear` | Clear a cell range |
| `sheets_add_sheet` | Add a new sheet tab |
| `sheets_delete_sheet` | Delete a sheet tab (by sheetId) |
| `sheets_copy_to` | Copy a sheet tab to another spreadsheet |
| `sheets_batch_update` | Update multiple cell ranges in one request |

### Google Drive (11 tools)

| Tool | Description |
|---|---|
| `drive_list` | List files and folders in a Drive folder |
| `drive_search` | Search files by name, MIME type, or parent folder |
| `drive_get` | Get file metadata (name, type, size, URL, parents) |
| `drive_download` | Download file content |
| `drive_create_folder` | Create a folder |
| `drive_upload` | Upload a file |
| `drive_move` | Move a file or folder |
| `drive_rename` | Rename a file or folder |
| `drive_delete` | Permanently delete a file or folder |
| `drive_share` | Share a file with a user by email and role |
| `drive_copy` | Copy a file |

### Google Docs (7 tools)

| Tool | Description |
|---|---|
| `docs_get` | Read a document as plain text |
| `docs_create` | Create a new document |
| `docs_append` | Append text to the end of a document |
| `docs_update` | Find and replace text throughout a document |
| `docs_get_raw` | Get the full raw JSON structure |
| `docs_insert_table` | Insert a table at a given position |
| `docs_export` | Export a document as PDF, DOCX, or plain text |

## Security

- **No third parties.** Data path: Claude Code → local Node.js process → Google API.
- **SA JSON stays local.** The key file is only read from your filesystem. It is never transmitted or logged.
- **Never commit your SA JSON to git.**

## Development

```bash
git clone git@github.com:Red4beard/mcp-google-workspace.git
cd mcp-google-workspace
npm install
npm test        # run unit tests
npm run build   # compile TypeScript → dist/
```

After making changes, rebuild and commit `dist/`:

```bash
npm run build
git add src/ dist/
git commit -m "feat: describe your change"
git push
```

# mcp-google-workspace

MCP server for Google Workspace — gives Claude Code direct access to **Google Sheets**, **Google Drive**, and **Google Docs** via Service Account authentication. No third-party intermediaries: your data goes from Claude Code to your local machine to Google's API and back.

## Requirements

- Node.js 18+
- A Google Cloud Service Account JSON key with Sheets, Drive, and Docs APIs enabled

---

## Quick Install via Claude

Copy this prompt and paste it into **Claude Code**. It will do everything automatically:

> **Note:** This prompt runs entirely on your local machine.
> The SA JSON key is never transmitted — only its `client_email`
> (a non-secret public identifier) is printed so you know which address to use when sharing files in Google Drive.

````text
Install the mcp-google-workspace MCP server for me by following these steps exactly:

1. Check that Node.js 18+ is installed (`node --version`). If not, tell me to install it and stop.

2. Ask me for the path to my Google Service Account JSON file. Default suggestion: `~/.config/gcp/sa.json`. Wait for my answer before proceeding. If the file does not exist at the path I gave, list the contents of that directory and ask me to confirm the correct filename before continuing.

3. Verify the file exists at the path I provided. Read it and confirm it contains `"type": "service_account"`, then print ONLY the `client_email` value — do not print the full file contents or the private key. This email is the address you'll use to share your Google files with the service account.

4. Check if `~/.mcp.json` exists.
   - If it does NOT exist: create it with this content (replace SA_PATH with my actual path):
     ```json
     {
       "mcpServers": {
         "google-workspace": {
           "command": "npx",
           "args": ["-y", "github:Red4beard/mcp-google-workspace"],
           "env": {
             "GOOGLE_APPLICATION_CREDENTIALS": "SA_PATH"
           }
         }
       }
     }
     ```
   - If it DOES exist: read it and add the `google-workspace` entry to the existing `mcpServers` object. Do not overwrite other servers.

5. Verify the server works by running:
   ```
   printf '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}},"id":1}\n' | GOOGLE_APPLICATION_CREDENTIALS=SA_PATH npx -y github:Red4beard/mcp-google-workspace 2>/dev/null
   ```
   Confirm it returns a valid JSON response with `"name":"mcp-google-workspace"`.

6. Tell me:
   - The `client_email` from the SA JSON — you'll need this email to share your Drive files with the service account (Step 4 in Manual Setup)
   - That I must fully restart VSCode (Cmd+Q, not just Reload Window) for the MCP server to load
   - How to verify: after restart, ask Claude "List my accessible Google Sheets"
````

---

## Manual Setup

### 1. Get a Service Account JSON key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable under **APIs & Services → Enable APIs**:
   - Google Sheets API
   - Google Drive API
   - Google Docs API
3. Go to **IAM & Admin → Service Accounts → Create**
4. Name it (e.g. `mcp-workspace`), skip role assignment, click Done
5. Click the account → **Keys → Add Key → Create new key → JSON** → download
6. Save the JSON to `~/.config/gcp/sa.json` (or any path you prefer)

### 2. Add to `~/.mcp.json`

> **Important:** Use `~/.mcp.json`, not `~/.claude/settings.json`.
> Claude Code VSCode extension does **not** load stdio servers from `settings.json` — it reads them from `.mcp.json` only.

Create or edit `~/.mcp.json`:

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

Replace the path with the actual location of your SA JSON file.

### 3. Restart VSCode completely

> **Important:** `Developer: Reload Window` is **not enough**.
> Use **Cmd+Q** (Mac) or **File → Quit** to fully close VSCode, then reopen it.
> MCP servers are loaded at startup — a window reload does not re-read `~/.mcp.json`.

### 4. Share files with the Service Account

The Service Account is like a separate Google user. It can only access files explicitly shared with it.

1. Open any Google Sheet, Drive folder, or Doc you want Claude to access
2. Click **Share**
3. Paste the `client_email` from your SA JSON (e.g. `mcp-workspace@your-project.iam.gserviceaccount.com`)
4. Set role to **Editor**

### 5. Verify

Run in terminal:
```bash
claude mcp list
```

You should see:

```text
google-workspace: npx -y github:Red4beard/mcp-google-workspace - ✓ Connected
```

Then ask Claude: *"List my accessible Google Sheets"*

---

## Updating

When this repo gets new tools, clear the npx cache to get the latest version:

```bash
npx clear-npx-cache
```

Then fully restart VSCode.

---

## Tools Reference

### Google Sheets (12 tools)

| Tool | Description |
| --- | --- |
| `sheets_list` | List spreadsheets, optionally filtered by Drive folder |
| `sheets_get` | Read cell data from a range (A1 notation) |
| `sheets_update` | Write or update cells in a range |
| `sheets_create` | Create a new spreadsheet |
| `sheets_list_sheets` | List all sheet tabs with their numeric sheetIds |
| `sheets_append` | Append rows to the end of a sheet |
| `sheets_clear` | Clear a cell range |
| `sheets_add_sheet` | Add a new sheet tab |
| `sheets_delete_sheet` | Delete a sheet tab (by numeric sheetId) |
| `sheets_copy_to` | Copy a sheet tab to another spreadsheet |
| `sheets_batch_update` | Update multiple cell ranges in one request |
| `sheets_format_cells` | Format cells: background color, text color, bold, font size |

### Google Drive (11 tools)

| Tool | Description |
| --- | --- |
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
| --- | --- |
| `docs_get` | Read a document as plain text |
| `docs_create` | Create a new document |
| `docs_append` | Append text to the end of a document |
| `docs_update` | Find and replace text throughout a document |
| `docs_get_raw` | Get the full raw JSON structure |
| `docs_insert_table` | Insert a table at a given position |
| `docs_export` | Export a document as PDF, DOCX, or plain text |

---

## Security

- **No third parties.** Data path: Claude Code → local Node.js process → Google API.
- **SA JSON stays local.** The key file is only read from your filesystem. It is never transmitted or logged.
- **Never commit your SA JSON to git.**

---

## Development

```bash
git clone git@github.com:Red4beard/mcp-google-workspace.git
cd mcp-google-workspace
npm install
npm run build   # compile TypeScript → dist/
```

After making changes, rebuild and commit `dist/`:

```bash
npm run build
git add src/ dist/
git commit -m "feat: describe your change"
git push
```

To use a local build instead of the GitHub version, update `~/.mcp.json`:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-google-workspace/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/sa.json"
      }
    }
  }
}
```

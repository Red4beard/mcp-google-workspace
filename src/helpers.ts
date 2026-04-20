import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function ok(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

export function err(error: unknown): CallToolResult {
  let message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code ?? (error as any)?.status;
  if (code === 404 || message.includes("404")) {
    message = "Not found. Verify the file/spreadsheet ID and that it is shared with your Service Account.";
  } else if (code === 403 || message.includes("403")) {
    message = "Access denied. Share the file with your Service Account email (see 'client_email' in your SA JSON).";
  } else if (code === 400 || message.includes("400")) {
    message = `Bad request: ${message}. Check parameters — use A1 notation for ranges (e.g. A1:C10).`;
  } else if (message.includes("GOOGLE_APPLICATION_CREDENTIALS")) {
    message = "Auth error: GOOGLE_APPLICATION_CREDENTIALS not set or JSON file not found.";
  } else if (message.includes("quota") || message.includes("429")) {
    message = "Rate limit exceeded. Wait a few seconds and try again.";
  }
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

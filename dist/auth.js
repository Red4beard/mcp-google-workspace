import { google } from "googleapis";
export const auth = new google.auth.GoogleAuth({
    scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
    ],
});
export const sheetsClient = google.sheets({ version: "v4", auth });
export const driveClient = google.drive({ version: "v3", auth });
export const docsClient = google.docs({ version: "v1", auth });

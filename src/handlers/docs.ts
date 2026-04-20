import type { docs_v1, drive_v3 } from "googleapis";

function extractStructuralElements(elements: docs_v1.Schema$StructuralElement[]): string {
  return elements.map((el) => {
    if (el.paragraph) {
      return (el.paragraph.elements ?? [])
        .map((e) => e.textRun?.content ?? "")
        .join("");
    }
    if (el.table) {
      return (el.table.tableRows ?? [])
        .flatMap((row) => row.tableCells ?? [])
        .map((cell) => extractStructuralElements(cell.content ?? []))
        .join("\t");
    }
    return "";
  }).join("");
}

function extractDocText(doc: docs_v1.Schema$Document): string {
  return extractStructuralElements(doc.body?.content ?? []);
}

export async function handleDocsGet(
  docs: docs_v1.Docs,
  params: { documentId: string }
): Promise<string> {
  const res = await docs.documents.get({ documentId: params.documentId });
  return extractDocText(res.data);
}

export async function handleDocsCreate(
  docs: docs_v1.Docs,
  params: { title: string }
): Promise<string> {
  const res = await docs.documents.create({ requestBody: { title: params.title } });
  return `Created: ${res.data.documentId}\nURL: https://docs.google.com/document/d/${res.data.documentId}`;
}

export async function handleDocsAppend(
  docs: docs_v1.Docs,
  params: { documentId: string; text: string }
): Promise<string> {
  const doc = await docs.documents.get({ documentId: params.documentId });
  const endIndex = doc.data.body?.content?.slice(-1)[0]?.endIndex ?? 1;
  await docs.documents.batchUpdate({
    documentId: params.documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: endIndex - 1 },
            text: params.text,
          },
        },
      ],
    },
  });
  return `Appended ${params.text.length} characters to document ${params.documentId}.`;
}

export async function handleDocsUpdate(
  docs: docs_v1.Docs,
  params: { documentId: string; searchText: string; replaceText: string }
): Promise<string> {
  const res = await docs.documents.batchUpdate({
    documentId: params.documentId,
    requestBody: {
      requests: [
        {
          replaceAllText: {
            containsText: { text: params.searchText, matchCase: true },
            replaceText: params.replaceText,
          },
        },
      ],
    },
  });
  const count = res.data.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;
  return `Replaced ${count} occurrence(s) of "${params.searchText}" with "${params.replaceText}".`;
}

export async function handleDocsGetRaw(
  docs: docs_v1.Docs,
  params: { documentId: string }
): Promise<string> {
  const res = await docs.documents.get({ documentId: params.documentId });
  return JSON.stringify(res.data, null, 2);
}

export async function handleDocsInsertTable(
  docs: docs_v1.Docs,
  params: { documentId: string; rows: number; columns: number; index?: number }
): Promise<string> {
  const insertIndex = params.index ?? 1;
  await docs.documents.batchUpdate({
    documentId: params.documentId,
    requestBody: {
      requests: [
        {
          insertTable: {
            rows: params.rows,
            columns: params.columns,
            location: { index: insertIndex },
          },
        },
      ],
    },
  });
  return `Inserted ${params.rows}×${params.columns} table at index ${insertIndex}.`;
}

export async function handleDocsExport(
  drive: drive_v3.Drive,
  params: { documentId: string; format: "pdf" | "docx" | "txt" }
): Promise<string> {
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
  };
  const mimeType = mimeMap[params.format] ?? "application/pdf";
  const res = await drive.files.export(
    { fileId: params.documentId, mimeType },
    { responseType: "arraybuffer" }
  );
  const buffer = Buffer.from(res.data as ArrayBuffer);
  if (params.format === "txt") return buffer.toString("utf-8");
  return `base64:${buffer.toString("base64")}`;
}

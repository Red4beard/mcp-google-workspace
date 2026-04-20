function extractStructuralElements(elements) {
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
function extractDocText(doc) {
    return extractStructuralElements(doc.body?.content ?? []);
}
export async function handleDocsGet(docs, params) {
    const res = await docs.documents.get({ documentId: params.documentId });
    return extractDocText(res.data);
}
export async function handleDocsCreate(docs, params) {
    const res = await docs.documents.create({ requestBody: { title: params.title } });
    return `Created: ${res.data.documentId}\nURL: https://docs.google.com/document/d/${res.data.documentId}`;
}
export async function handleDocsAppend(docs, params) {
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
export async function handleDocsUpdate(docs, params) {
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
export async function handleDocsGetRaw(docs, params) {
    const res = await docs.documents.get({ documentId: params.documentId });
    return JSON.stringify(res.data, null, 2);
}
export async function handleDocsInsertTable(docs, params) {
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
export async function handleDocsExport(drive, params) {
    const mimeMap = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
    };
    const mimeType = mimeMap[params.format] ?? "application/pdf";
    const res = await drive.files.export({ fileId: params.documentId, mimeType }, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);
    if (params.format === "txt")
        return buffer.toString("utf-8");
    return `base64:${buffer.toString("base64")}`;
}

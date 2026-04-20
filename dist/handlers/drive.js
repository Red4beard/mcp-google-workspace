export async function handleDriveList(drive, params) {
    const safeFolderId = (params.folderId ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const q = params.folderId
        ? `'${safeFolderId}' in parents and trashed=false`
        : `'root' in parents and trashed=false`;
    const res = await drive.files.list({
        q,
        fields: "files(id,name,mimeType,size,webViewLink)",
        pageSize: 100,
    });
    const files = res.data.files ?? [];
    if (files.length === 0)
        return "Folder is empty.";
    return files
        .map((f) => `[${f.mimeType?.split(".").pop()}] ${f.name} — id: ${f.id}`)
        .join("\n");
}
export async function handleDriveSearch(drive, params) {
    const safeQuery = params.query.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    let q = `name contains '${safeQuery}' and trashed=false`;
    if (params.folderId)
        q += ` and '${params.folderId}' in parents`;
    if (params.mimeType)
        q += ` and mimeType='${params.mimeType}'`;
    const res = await drive.files.list({
        q,
        fields: "files(id,name,mimeType,webViewLink)",
        pageSize: 50,
    });
    const files = res.data.files ?? [];
    if (files.length === 0)
        return `No files found matching "${params.query}".`;
    return files.map((f) => `${f.name} — id: ${f.id}\n  ${f.webViewLink}`).join("\n");
}
export async function handleDriveGet(drive, params) {
    const res = await drive.files.get({
        fileId: params.fileId,
        fields: "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents",
    });
    const f = res.data;
    return [
        `Name: ${f.name}`,
        `ID: ${f.id}`,
        `Type: ${f.mimeType}`,
        `Size: ${f.size ? Math.round(Number(f.size) / 1024) + " KB" : "N/A"}`,
        `Created: ${f.createdTime}`,
        `Modified: ${f.modifiedTime}`,
        `URL: ${f.webViewLink}`,
        `Parents: ${f.parents?.join(", ")}`,
    ].join("\n");
}
export async function handleDriveDownload(drive, params) {
    const meta = await drive.files.get({ fileId: params.fileId, fields: "mimeType,name" });
    const fileMime = meta.data.mimeType ?? "";
    const isGoogleDoc = fileMime.startsWith("application/vnd.google-apps.");
    if (isGoogleDoc) {
        const exportMime = params.mimeType ?? "text/plain";
        const res = await drive.files.export({ fileId: params.fileId, mimeType: exportMime }, { responseType: "text" });
        return String(res.data);
    }
    else {
        const res = await drive.files.get({ fileId: params.fileId, alt: "media" }, { responseType: "arraybuffer" });
        const buffer = Buffer.from(res.data);
        return `base64:${buffer.toString("base64")}`;
    }
}
export async function handleDriveCreateFolder(drive, params) {
    const res = await drive.files.create({
        requestBody: {
            name: params.name,
            mimeType: "application/vnd.google-apps.folder",
            parents: params.parentId ? [params.parentId] : undefined,
        },
        fields: "id,name,webViewLink",
    });
    return `Created folder "${res.data.name}" — id: ${res.data.id}\n${res.data.webViewLink}`;
}
export async function handleDriveUpload(drive, params) {
    const body = params.content.startsWith("base64:")
        ? Buffer.from(params.content.slice(7), "base64")
        : params.content;
    const res = await drive.files.create({
        requestBody: {
            name: params.name,
            parents: params.parentId ? [params.parentId] : undefined,
        },
        media: { mimeType: params.mimeType, body },
        fields: "id,name,webViewLink",
    });
    return `Uploaded "${res.data.name}" — id: ${res.data.id}\n${res.data.webViewLink}`;
}
export async function handleDriveMove(drive, params) {
    const meta = await drive.files.get({ fileId: params.fileId, fields: "parents" });
    const oldParents = meta.data.parents?.join(",") ?? "";
    await drive.files.update({
        fileId: params.fileId,
        addParents: params.newParentId,
        removeParents: oldParents,
        fields: "id,parents",
    });
    return `Moved file ${params.fileId} to folder ${params.newParentId}.`;
}
export async function handleDriveRename(drive, params) {
    const res = await drive.files.update({
        fileId: params.fileId,
        requestBody: { name: params.newName },
        fields: "id,name",
    });
    return `Renamed to "${res.data.name}" (id: ${res.data.id}).`;
}
export async function handleDriveDelete(drive, params) {
    await drive.files.delete({ fileId: params.fileId });
    return `Deleted file ${params.fileId}.`;
}
export async function handleDriveShare(drive, params) {
    await drive.permissions.create({
        fileId: params.fileId,
        requestBody: {
            type: "user",
            role: params.role,
            emailAddress: params.email,
        },
    });
    return `Shared ${params.fileId} with ${params.email} as ${params.role}.`;
}
export async function handleDriveCopy(drive, params) {
    const res = await drive.files.copy({
        fileId: params.fileId,
        requestBody: {
            name: params.newName,
            parents: params.parentId ? [params.parentId] : undefined,
        },
        fields: "id,name,webViewLink",
    });
    return `Copied as "${res.data.name}" — id: ${res.data.id}\n${res.data.webViewLink}`;
}

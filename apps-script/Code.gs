/**
 * DriveHub - Google Apps Script backend
 * 1. Isi ID folder Google Drive pada konfigurasi FOLDERS.
 * 2. Deploy sebagai Web App: Execute as Me, access Anyone.
 * 3. Salin URL /exec ke konstanta SCRIPT_URL pada ketiga halaman upload.
 */

const FOLDERS = {
  FOLDER_1: "MASUKKAN_ID_FOLDER_GOOGLE_DRIVE_1",
  FOLDER_2: "MASUKKAN_ID_FOLDER_GOOGLE_DRIVE_2",
  FOLDER_3: "MASUKKAN_ID_FOLDER_GOOGLE_DRIVE_3"
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function doPost(e) {
  let requestId = "";
  try {
    if (!e || !e.parameter || !e.parameter.payload) {
      throw new Error("Data upload tidak ditemukan.");
    }

    const data = JSON.parse(e.parameter.payload);
    requestId = String(data.requestId || "");
    const folderId = FOLDERS[data.folderKey];

    if (!folderId || folderId.indexOf("MASUKKAN_ID_") === 0) {
      throw new Error("Folder tujuan belum dikonfigurasi oleh pengelola.");
    }
    if (!data.base64 || !data.fileName) {
      throw new Error("File atau nama file tidak valid.");
    }

    const bytes = Utilities.base64Decode(data.base64);
    if (bytes.length > MAX_FILE_BYTES) {
      throw new Error("Ukuran file melebihi batas 5 MB.");
    }

    const safeName = sanitizeFileName(data.fileName);
    const mimeType = String(data.mimeType || "application/octet-stream").slice(0, 120);
    const blob = Utilities.newBlob(bytes, mimeType, safeName);
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    return responseHtml({
      ok: true,
      requestId: requestId,
      fileId: file.getId()
    });
  } catch (err) {
    return responseHtml({
      ok: false,
      requestId: requestId,
      error: err && err.message ? err.message : "Terjadi kesalahan pada server."
    });
  }
}

function sanitizeFileName(name) {
  let clean = String(name).replace(/[\\\/:*?"<>|#%{}~&]/g, "_").trim();
  if (!clean) clean = "upload";
  if (clean.length > 180) clean = clean.substring(0, 180);
  return clean;
}

function responseHtml(result) {
  const json = JSON.stringify(result).replace(/</g, "\\u003c");
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.parent.postMessage(' + json + ', "*");</script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

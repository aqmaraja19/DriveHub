/**
 * DRIVEHUB — Google Apps Script backend
 *
 * Setiap key pada FOLDERS harus sama persis dengan atribut
 * data-folder pada form di halaman HTML.
 */

const FOLDERS = {
  "UPLOAD_1": "GANTI_DENGAN_ID_FOLDER_GOOGLE_DRIVE_1",
  "TUGAS_1": "GANTI_DENGAN_ID_FOLDER_GOOGLE_DRIVE_2",
  "UPLOAD_3": "GANTI_DENGAN_ID_FOLDER_GOOGLE_DRIVE_3"
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "pdf": ["application/pdf"],
  "png": ["image/png"],
  "jpg": ["image/jpeg"],
  "jpeg": ["image/jpeg"]
};

function doPost(e) {
  let requestId = "";

  try {
    if (!e || !e.parameter || !e.parameter.payload) {
      throw new Error("Data upload tidak ditemukan.");
    }

    const data = JSON.parse(e.parameter.payload);
    requestId = String(data.requestId || "");

    const folderKey = String(data.folderKey || "");
    const folderId = FOLDERS[folderKey];

    if (!folderId || folderId.indexOf("GANTI_DENGAN_ID_") === 0) {
      throw new Error("Folder tujuan belum dikonfigurasi atau tidak ditemukan.");
    }

    if (!data.fileName || !data.base64) {
      throw new Error("Nama file atau isi file tidak ditemukan.");
    }

    const fileName = sanitizeFileName(data.fileName);
    const extension = getExtension(fileName);
    const mimeType = String(data.mimeType || "").toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, extension)) {
      throw new Error("Format tidak diizinkan. Gunakan PDF, PNG, JPG, atau JPEG.");
    }

    if (ALLOWED_TYPES[extension].indexOf(mimeType) === -1) {
      throw new Error("MIME type tidak sesuai dengan ekstensi file.");
    }

    const bytes = Utilities.base64Decode(data.base64);

    if (!bytes || bytes.length === 0) {
      throw new Error("File kosong atau tidak valid.");
    }

    if (bytes.length > MAX_FILE_SIZE) {
      throw new Error("Ukuran file maksimal 5 MB.");
    }

    const folder = DriveApp.getFolderById(folderId);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const createdFile = folder.createFile(blob);

    return createResponse({
      ok: true,
      requestId: requestId,
      fileName: createdFile.getName(),
      message: "File berhasil disimpan ke Google Drive."
    });

  } catch (error) {
    return createResponse({
      ok: false,
      requestId: requestId,
      error: error && error.message
        ? error.message
        : "Terjadi kesalahan pada server."
    });
  }
}

function getExtension(fileName) {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.substring(dot + 1).toLowerCase() : "";
}

function sanitizeFileName(name) {
  let clean = String(name)
    .replace(/[\\/:*?"<>|#%{}~&]/g, "_")
    .trim();

  clean = clean.replace(/^\.+|\.+$/g, "");

  if (!clean) {
    throw new Error("Nama file tidak valid.");
  }

  if (clean.length > 180) {
    throw new Error("Nama file terlalu panjang.");
  }

  return clean;
}

function createResponse(result) {
  // Escape karakter yang dapat mengakhiri tag script HTML.
  const json = JSON.stringify(result)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  const html =
    '<!doctype html><html><head><meta charset="UTF-8"></head><body>' +
    '<script>window.parent.postMessage(' + json + ', "*");</script>' +
    '</body></html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

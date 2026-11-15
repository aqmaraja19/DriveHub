(() => {
  "use strict";

  // Ganti dengan URL Web App Apps Script yang berakhiran /exec.
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnL3W3D80PgIjwqPjPnr0wkf6rO_Cw2avj9tCguy4gWFkjdN-_lBC9p5desdwAcuZg/exec";

  // Batas 5 MB. Base64 akan menambah ukuran data saat dikirim.
  const MAX_BYTES = 20 * 1024 * 1024;
  const TIMEOUT_MS = 120000;

  const ALLOWED_TYPES = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg"
  };

  const form = document.getElementById("uploadForm");
  if (!form) return;

  const fileInput = document.getElementById("file");
  const nameInput = document.getElementById("newName");
  const payloadInput = document.getElementById("payload");
  const iframe = document.getElementById("uploadFrame");
  const button = document.getElementById("submitBtn");
  const bar = document.getElementById("bar");
  const status = document.getElementById("status");

  if (!fileInput || !nameInput || !payloadInput || !iframe || !button || !bar || !status) {
    console.error("DriveHub: elemen HTML upload tidak lengkap.");
    return;
  }

  let busy = false;
  let uploadTimeout = null;
  let activeRequestId = "";

  function showMessage(text, type = "") {
    status.textContent = text;
    status.className = "status" + (type ? " " + type : "");
  }

  function setProgress(value) {
    bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  function resetUploadState() {
    busy = false;
    if (uploadTimeout !== null) {
      clearTimeout(uploadTimeout);
      uploadTimeout = null;
    }
    button.disabled = false;
    button.textContent = "Unggah File";
  }

  function makeSafeFileName(inputName, originalExtension) {
    let name = String(inputName || "").trim();
    name = name.replace(/[\\/:*?"<>|#%{}~&]/g, "_");

    if (!name) return "";

    const lastDot = name.lastIndexOf(".");
    const suppliedExtension = lastDot > 0 ? name.slice(lastDot + 1).toLowerCase() : "";

    // Jika pengguna mengetik ekstensi, pastikan sama dengan ekstensi file sumber.
    if (suppliedExtension && suppliedExtension !== originalExtension) {
      name = name.slice(0, lastDot);
    } else if (suppliedExtension === originalExtension) {
      name = name.slice(0, lastDot);
    }

    name = name.replace(/\.+$/g, "").trim();
    if (!name) return "";

    return `${name}.${originalExtension}`;
  }

  window.addEventListener("message", (event) => {
    // Respons harus berasal dari iframe upload yang sedang digunakan.
    if (event.source !== iframe.contentWindow || !event.data) return;
    if (!activeRequestId || event.data.requestId !== activeRequestId) return;

    resetUploadState();

    if (event.data.ok === true) {
      setProgress(100);
      showMessage(event.data.message || "File berhasil disimpan ke Google Drive.", "ok");
      form.reset();
      activeRequestId = "";
    } else {
      showMessage(event.data.error || "Upload gagal. Silakan coba lagi.", "err");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy) return;

    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      showMessage("Pilih file terlebih dahulu.", "err");
      return;
    }

    if (file.size <= 0) {
      showMessage("File kosong atau tidak valid.", "err");
      return;
    }

    if (file.size > MAX_BYTES) {
      showMessage("Ukuran file maksimal 20 MB.", "err");
      return;
    }

    const originalExtension = file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase()
      : "";

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, originalExtension)) {
      showMessage("Hanya file PDF, PNG, JPG, dan JPEG yang diizinkan.", "err");
      return;
    }

    const folderKey = form.dataset.folder;
    if (!folderKey) {
      showMessage("Kunci folder belum diatur pada atribut data-folder.", "err");
      return;
    }

    if (!SCRIPT_URL.startsWith("https://script.google.com/macros/s/") ||
        !SCRIPT_URL.endsWith("/exec")) {
      showMessage("URL Apps Script belum diatur dengan benar.", "err");
      return;
    }

    busy = true;
    button.disabled = true;
    button.textContent = "Membaca file…";
    showMessage("Membaca file…");
    setProgress(3);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(3 + (e.loaded / e.total) * 42);
      }
    };

    reader.onerror = () => {
      resetUploadState();
      showMessage("Gagal membaca file dari perangkat.", "err");
      setProgress(0);
    };

    reader.onload = () => {
      try {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(",");
        if (commaIndex < 0) throw new Error("Data file tidak dapat dibaca.");

        const base64 = result.slice(commaIndex + 1);
        if (!base64) throw new Error("Isi file kosong.");

        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const customName = makeSafeFileName(nameInput.value, originalExtension);
        const finalName = customName || file.name;

        payloadInput.value = JSON.stringify({
          requestId,
          folderKey,
          fileName: finalName,
          mimeType: ALLOWED_TYPES[originalExtension],
          base64
        });

        activeRequestId = requestId;
        form.action = SCRIPT_URL;

        setProgress(50);
        showMessage("Mengirim file ke Google Apps Script…");
        button.textContent = "Mengunggah…";

        // Pasang timeout sebelum submit agar respons cepat pun tidak terlewat.
        uploadTimeout = setTimeout(() => {
          if (!busy || activeRequestId !== requestId) return;

          resetUploadState();
          activeRequestId = "";
          showMessage(
            "Waktu tunggu habis. Server belum memberikan respons. Periksa Google Drive sebelum mencoba ulang.",
            "err"
          );
        }, TIMEOUT_MS);

        form.submit();

        // Ini indikator tahap, bukan persentase transfer jaringan sebenarnya.
        setProgress(70);
      } catch (error) {
        console.error("DriveHub upload preparation error:", error);
        resetUploadState();
        activeRequestId = "";
        showMessage(error.message || "Terjadi kesalahan saat menyiapkan upload.", "err");
        setProgress(0);
      }
    };

    reader.readAsDataURL(file);
  });
})();

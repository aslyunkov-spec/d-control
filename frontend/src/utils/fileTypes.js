const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"]);

const CATEGORY_BY_EXTENSION = new Map([
  ["doc", "word"],
  ["docx", "word"],
  ["rtf", "word"],
  ["odt", "word"],
  ["xls", "excel"],
  ["xlsx", "excel"],
  ["xlsb", "excel"],
  ["xlsm", "excel"],
  ["ods", "excel"],
  ["csv", "excel"],
  ["pdf", "pdf"],
  ["ppt", "powerpoint"],
  ["pptx", "powerpoint"],
  ["odp", "powerpoint"],
  ["zip", "zip"],
  ["rar", "rar"],
  ["7z", "7zip"],
  ["tar", "zip"],
  ["gz", "zip"],
  ["txt", "text"],
  ["md", "text"],
  ["log", "text"],
  ["json", "code"],
  ["xml", "code"],
  ["html", "code"],
  ["css", "code"],
  ["js", "code"],
  ["jsx", "code"],
  ["ts", "code"],
  ["tsx", "code"],
  ["yaml", "code"],
  ["yml", "code"],
  ["mp3", "audio"],
  ["wav", "audio"],
  ["ogg", "audio"],
  ["m4a", "audio"],
  ["mp4", "video"],
  ["avi", "video"],
  ["mov", "video"],
  ["webm", "video"],
  ["mkv", "video"],
]);

const MIME_CATEGORY_PREFIXES = [
  ["image/", "image"],
  ["audio/", "audio"],
  ["video/", "video"],
  ["text/", "text"],
];

const LABEL_BY_CATEGORY = {
  image: "IMG",
  word: "WORD",
  excel: "EXCEL",
  pdf: "PDF",
  powerpoint: "P.POINT",
  zip: "ZIP",
  rar: "RAR",
  "7zip": "7-ZIP",
  text: "TEXT",
  code: "CODE",
  audio: "AUDIO",
  video: "VIDEO",
  file: "FILE",
};

const EXTENSION_LABELS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "mp3",
  "wav",
  "mp4",
  "avi",
  "mov",
  "json",
  "xml",
  "html",
  "css",
  "js",
]);

export function getFileName(file = {}) {
  if (typeof file === "string") {
    return file;
  }

  return String(file.original_name || file.name || file.filename || "");
}

export function getFileExtension(file = {}) {
  if (typeof file !== "string" && file.extension) {
    return String(file.extension).replace(/^\./, "").toLowerCase();
  }

  const fileName = getFileName(file).toLowerCase();
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function getMimeType(file = {}) {
  if (typeof file === "string") {
    return "";
  }

  return String(file.mimeType || file.mime_type || file.content_type || file.type || "").toLowerCase();
}

function getCategoryByMime(mimeType) {
  const match = MIME_CATEGORY_PREFIXES.find(([prefix]) => mimeType.startsWith(prefix));
  return match?.[1] || "";
}

function getDisplayLabel(category, extension) {
  if (EXTENSION_LABELS.has(extension)) {
    return extension.toUpperCase();
  }

  return LABEL_BY_CATEGORY[category] || LABEL_BY_CATEGORY.file;
}

export function getFileTypeInfo(file = {}) {
  const extension = getFileExtension(file);
  const mimeType = getMimeType(file);
  const isImage = IMAGE_EXTENSIONS.has(extension) || mimeType.startsWith("image/");
  const category = isImage
    ? "image"
    : CATEGORY_BY_EXTENSION.get(extension) || getCategoryByMime(mimeType) || "file";

  return {
    category,
    extension,
    iconVariant: category,
    isImage,
    label: getDisplayLabel(category, extension),
    mimeType,
  };
}

export function formatFileSize(size) {
  const numericSize = Number(size);
  if (!Number.isFinite(numericSize) || numericSize < 0) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = numericSize;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${Math.round(value)} ${units[unitIndex]}`;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

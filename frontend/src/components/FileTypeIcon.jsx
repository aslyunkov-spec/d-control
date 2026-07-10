import { getFileTypeInfo } from "../utils/fileTypes";

const FILE_TYPE_STYLES = {
  word: {
    label: "WORD",
    body: "#2f75b9",
    badge: "#145a96",
    fold: "#79add8",
  },
  excel: {
    label: "EXCEL",
    body: "#21b875",
    badge: "#078a51",
    fold: "#79d4ad",
  },
  powerpoint: {
    label: "P.POINT",
    body: "#e87932",
    badge: "#bd4f17",
    fold: "#f0aa7a",
  },
  pdf: {
    label: "PDF",
    body: "#dc4a45",
    badge: "#b52f2b",
    fold: "#eb8b87",
  },
  zip: {
    label: "ZIP",
    body: "#e6a426",
    badge: "#b8790d",
    fold: "#f2ca73",
  },
  rar: {
    label: "RAR",
    body: "#db762e",
    badge: "#ad4f12",
    fold: "#eba474",
  },
  "7zip": {
    label: "7-ZIP",
    body: "#7651b5",
    badge: "#553393",
    fold: "#aa91d2",
  },
  text: {
    label: "TEXT",
    body: "#df842f",
    badge: "#b85c12",
    fold: "#efb17a",
  },
  file: {
    label: "FILE",
    body: "#7a8794",
    badge: "#56616c",
    fold: "#aeb7bf",
  },
};

const CATEGORY_ALIAS = {
  document: "word",
  spreadsheet: "excel",
  presentation: "powerpoint",
  code: "file",
  audio: "file",
  video: "file",
  image: "file",
};

function getIconConfig(fileType) {
  const key = CATEGORY_ALIAS[fileType.iconVariant] || fileType.iconVariant || "file";
  return FILE_TYPE_STYLES[key] || FILE_TYPE_STYLES.file;
}

export function FileTypeIcon({ file, filename, extension, mimeType, size = "default", className = "" }) {
  const fileInput = filename || extension || mimeType
    ? {
        original_name: file?.original_name,
        name: filename || file?.name,
        filename: file?.filename,
        extension,
        mimeType: mimeType || file?.mimeType || file?.mime_type || file?.content_type || file?.type,
      }
    : file;
  const fileType = getFileTypeInfo(fileInput);
  const config = getIconConfig(fileType);
  const classNames = [
    "file-type-icon",
    `file-type-icon--${fileType.iconVariant}`,
    `file-type-icon--size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classNames}
      aria-label={config.label}
      data-file-label={config.label}
      style={{
        "--file-icon-body": config.body,
        "--file-icon-label": config.badge,
        "--file-icon-fold": config.fold,
      }}
    >
      <span className="file-type-icon__document" aria-hidden="true">
        <span className="file-type-icon__diagonal-shadow" />
        <span className="file-type-icon__fold" />
      </span>
      <span className="file-type-icon__label" aria-hidden="true">
        {config.label}
      </span>
    </span>
  );
}

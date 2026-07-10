import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Tooltip } from "./Tooltip";

function getFileExtension(fileName = "") {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function isImageFile(fileName = "") {
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(getFileExtension(fileName));
}

function getFileIcon(fileName = "") {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") return { label: "PDF", type: "pdf" };
  if (["doc", "docx", "odt"].includes(extension)) return { label: "W", type: "word" };
  if (["xls", "xlsx", "ods", "csv"].includes(extension)) return { label: "X", type: "excel" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) return { label: "IMG", type: "image" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return { label: "ZIP", type: "archive" };

  return { label: "FILE", type: "file" };
}

function getFileUrl(file = {}) {
  return file.file_url || file.url || file.download_url || "";
}

function formatFileDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FileViewer({ files = [], initialIndex = 0, onClose }) {
  const safeFiles = useMemo(() => (Array.isArray(files) ? files.filter(Boolean) : []), [files]);
  const [currentIndex, setCurrentIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(safeFiles.length - 1, 0)));
  const currentFile = safeFiles[currentIndex];
  const fileName = currentFile?.name || currentFile?.original_name || "Файл";
  const fileUrl = getFileUrl(currentFile);
  const fileIcon = getFileIcon(fileName);
  const isImage = Boolean(fileUrl && isImageFile(fileName));
  const author = currentFile?.author || currentFile?.uploaded_by_username || "";
  const uploadedAt = formatFileDate(currentFile?.uploaded_at);
  const hasPrevious = safeFiles.length > 1;
  const hasNext = safeFiles.length > 1;

  const showPrevious = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + safeFiles.length) % safeFiles.length);
  }, [safeFiles.length]);

  const showNext = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % safeFiles.length);
  }, [safeFiles.length]);

  useEffect(() => {
    setCurrentIndex(Math.min(Math.max(initialIndex, 0), Math.max(safeFiles.length - 1, 0)));
  }, [initialIndex, safeFiles.length]);

  useEffect(() => {
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousScrollbarWidth = document.body.style.getPropertyValue("--file-viewer-scrollbar-width");

    document.body.style.setProperty("--file-viewer-scrollbar-width", `${scrollbarWidth}px`);
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.classList.add("file-viewer-open");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (previousScrollbarWidth) {
        document.body.style.setProperty("--file-viewer-scrollbar-width", previousScrollbarWidth);
      } else {
        document.body.style.removeProperty("--file-viewer-scrollbar-width");
      }
      document.body.classList.remove("file-viewer-open");
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
      if (event.key === "ArrowLeft" && safeFiles.length > 1) {
        event.preventDefault();
        showPrevious();
      }
      if (event.key === "ArrowRight" && safeFiles.length > 1) {
        event.preventDefault();
        showNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, safeFiles.length, showNext, showPrevious]);

  if (!currentFile || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="file-viewer" role="dialog" aria-modal="true" aria-label={fileName}>
      <button className="file-viewer__backdrop" type="button" aria-label="Закрыть просмотр" onClick={onClose} />

      <div className="file-viewer__topbar">
        <div className="file-viewer__title">
          <strong title={fileName}>{fileName}</strong>
          {(author || uploadedAt) && (
            <span>
              {author && <b>{author}</b>}
              {author && uploadedAt && <em aria-hidden="true">·</em>}
              {uploadedAt && <time>{uploadedAt}</time>}
            </span>
          )}
        </div>
        <Tooltip as="button" label="Закрыть" className="file-viewer__close" type="button" aria-label="Закрыть" onClick={onClose}>
          <X aria-hidden="true" size={22} strokeWidth={2} />
        </Tooltip>
      </div>

      {hasPrevious && (
        <Tooltip as="button" label="Предыдущий файл" className="file-viewer__nav file-viewer__nav--prev" type="button" aria-label="Предыдущий файл" onClick={showPrevious}>
          <ChevronLeft aria-hidden="true" size={25} strokeWidth={2} />
        </Tooltip>
      )}

      <main className="file-viewer__stage">
        {isImage ? (
          <img src={fileUrl} alt={fileName} />
        ) : (
          <div className="file-viewer__fallback">
            <span className={'timeline-file-icon timeline-file-icon--' + fileIcon.type}>{fileIcon.label}</span>
            <span>Предпросмотр пока недоступен</span>
          </div>
        )}
      </main>

      {hasNext && (
        <Tooltip as="button" label="Следующий файл" className="file-viewer__nav file-viewer__nav--next" type="button" aria-label="Следующий файл" onClick={showNext}>
          <ChevronRight aria-hidden="true" size={25} strokeWidth={2} />
        </Tooltip>
      )}

      <div className="file-viewer__bottombar">
        <Tooltip as="a" label="Скачать файл" className="file-viewer__action" href={fileUrl || undefined} download aria-disabled={!fileUrl}>
          <Download aria-hidden="true" size={16} strokeWidth={2} />
          <span>Скачать</span>
        </Tooltip>
        <span className="file-viewer__counter">{currentIndex + 1} / {safeFiles.length}</span>
        <Tooltip as="a" label="Открыть оригинал" className="file-viewer__action" href={fileUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!fileUrl}>
          <ExternalLink aria-hidden="true" size={16} strokeWidth={2} />
          <span>Открыть оригинал</span>
        </Tooltip>
      </div>
    </div>,
    document.body,
  );
}

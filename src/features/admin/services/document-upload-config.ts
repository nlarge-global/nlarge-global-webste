const MB = 1024 * 1024;

export const documentUploadConfig = {
  "application/pdf": { label: "PDF", extensions: [".pdf"], maxSize: 10 * MB },
  "image/png": { label: "PNG", extensions: [".png"], maxSize: 5 * MB },
  "image/jpeg": {
    label: "JPEG",
    extensions: [".jpg", ".jpeg"],
    maxSize: 5 * MB,
  },
  "application/zip": { label: "ZIP", extensions: [".zip"], maxSize: 25 * MB },
  "text/plain": { label: "Text", extensions: [".txt"], maxSize: 1 * MB },
} as const;

export type SupportedDocumentType = keyof typeof documentUploadConfig;

export const documentUploadAccept = Object.values(documentUploadConfig)
  .flatMap(({ extensions }) => extensions)
  .join(",");

export function getDocumentType(file: Pick<File, "name" | "type">) {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return (
    (Object.entries(documentUploadConfig).find(
      ([contentType, config]) =>
        contentType === file.type ||
        (config.extensions as readonly string[]).includes(extension),
    )?.[0] as SupportedDocumentType | undefined) ?? null
  );
}

export function formatFileSize(size: number) {
  return size >= MB
    ? `${(size / MB).toFixed(size % MB === 0 ? 0 : 1)} MB`
    : `${Math.max(1, Math.ceil(size / 1024))} KB`;
}

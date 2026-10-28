import mammoth from "mammoth";

export interface ParsedDocumentResult {
  textSnippet: string;
  isPdf: boolean;
  isDocx: boolean;
  mimeType: string;
}

/**
 * Parses CV file buffer (DOCX text extraction with mammoth, or PDF detection)
 */
export async function parseCvDocument(
  fileBuffer: Buffer,
  fileName: string,
  providedMime?: string
): Promise<ParsedDocumentResult> {
  const lowerName = fileName.toLowerCase();
  const isDocx =
    lowerName.endsWith(".docx") ||
    providedMime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isPdf = lowerName.endsWith(".pdf") || providedMime === "application/pdf";

  if (isDocx) {
    try {
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      return {
        textSnippet: value.trim(),
        isPdf: false,
        isDocx: true,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    } catch (err: any) {
      console.warn("Gagal mengekstrak teks DOCX dengan mammoth:", err.message);
      return {
        textSnippet: "",
        isPdf: false,
        isDocx: true,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }
  }

  if (isPdf) {
    return {
      textSnippet: "",
      isPdf: true,
      isDocx: false,
      mimeType: "application/pdf",
    };
  }

  // Fallback for plain text or unknown
  return {
    textSnippet: fileBuffer.toString("utf8", 0, Math.min(fileBuffer.length, 3000)),
    isPdf: false,
    isDocx: false,
    mimeType: providedMime || "application/octet-stream",
  };
}

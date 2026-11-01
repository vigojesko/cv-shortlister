import { getAuthenticatedGmailClient } from "./client";
import { prisma } from "../prisma";
import { sha256 } from "../crypto";
import { parseCvDocument } from "../parsers/document";
import { aiProvider } from "../ai/gemini";
import { RoutingResultSchema } from "../ai/provider";
import { buildRoutingPrompt, ROUTING_SYSTEM_INSTRUCTION } from "../ai/prompts";
import { screenCandidateCv } from "../screening/screener";
import { sendShortlistNotificationEmail } from "../notifications/mailer";

export interface SyncProgressResult {
  messagesFound: number;
  processedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Extracts plain text body from a Gmail payload
 */
function extractEmailBody(payload: any): string {
  let body = "";

  if (payload.body && payload.body.data) {
    try {
      body += Buffer.from(payload.body.data, "base64").toString("utf8");
    } catch (e) {}
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        try {
          body += Buffer.from(part.body.data, "base64").toString("utf8");
        } catch (e) {}
      } else if (part.parts) {
        body += extractEmailBody(part);
      }
    }
  }

  return body;
}

/**
 * Finds all PDF/DOCX attachments recursively in message parts
 */
function findCvAttachments(
  parts: any[],
  found: Array<{
    partId: string;
    filename: string;
    mimeType: string;
    attachmentId: string;
  }> = []
) {
  if (!parts || !Array.isArray(parts)) return found;

  for (const part of parts) {
    const filename = part.filename || "";
    const mimeType = part.mimeType || "";
    const lower = filename.toLowerCase();

    const isPdfOrDocx =
      lower.endsWith(".pdf") ||
      lower.endsWith(".docx") ||
      mimeType === "application/pdf" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (isPdfOrDocx && part.body && part.body.attachmentId) {
      found.push({
        partId: part.partId,
        filename: filename || `document_${part.partId}.pdf`,
        mimeType: mimeType || (lower.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf"),
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.parts) {
      findCvAttachments(part.parts, found);
    }
  }

  return found;
}

/**
 * Auto-routing logic:
 * Step 1: Match Position keyword filters in subject / labels
 * Step 2: If none or ambiguous (>1 match), ask AI routing
 */
export async function routeEmailToPosition(params: {
  subject: string;
  sender: string;
  bodySnippet: string;
  cvFileName: string;
  cvSnippet?: string;
  labels?: string[];
}): Promise<{
  positionId: string | null;
  needsReview: boolean;
  isJobApplication: boolean;
  reasoning: string;
}> {
  const activePositions = await prisma.position.findMany({
    where: { isActive: true },
  });

  if (activePositions.length === 0) {
    return {
      positionId: null,
      needsReview: true,
      isJobApplication: true,
      reasoning: "Tidak ada posisi kerja aktif yang sedang dibuka.",
    };
  }

  const subjectLower = params.subject.toLowerCase();
  const matchedPositions: typeof activePositions = [];

  for (const pos of activePositions) {
    let keywords: string[] = [];
    try {
      keywords = JSON.parse(pos.emailKeywords);
    } catch {
      keywords = pos.emailKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    }

    // Check keyword match in subject
    const matchesKeyword = keywords.some((kw) =>
      subjectLower.includes(kw.toLowerCase().trim())
    );

    // Check label match if provided
    let matchesLabel = false;
    if (pos.emailLabels && params.labels && params.labels.length > 0) {
      const labelsToCheck = pos.emailLabels
        .split(",")
        .map((l) => l.trim().toLowerCase());
      matchesLabel = params.labels.some((l) =>
        labelsToCheck.includes(l.toLowerCase())
      );
    }

    if (matchesKeyword || matchesLabel) {
      matchedPositions.push(pos);
    }
  }

  // Exact 1 match by filter rule
  if (matchedPositions.length === 1) {
    return {
      positionId: matchedPositions[0].id,
      needsReview: false,
      isJobApplication: true,
      reasoning: `Cocok otomatis dengan aturan filter posisi: "${matchedPositions[0].title}"`,
    };
  }

  // Ambiguous (> 1 matches) or 0 filter match -> Ask AI Routing
  try {
    const formattedActivePositions = activePositions.map((pos) => {
      let kw: string[] = [];
      try {
        kw = JSON.parse(pos.emailKeywords);
      } catch {
        kw = pos.emailKeywords.split(",").map((s) => s.trim());
      }
      return {
        id: pos.id,
        title: pos.title,
        department: pos.department,
        keywords: kw,
      };
    });

    const routingPrompt = buildRoutingPrompt({
      emailSubject: params.subject,
      emailSender: params.sender,
      emailBodySnippet: params.bodySnippet.slice(0, 1500),
      cvFileName: params.cvFileName,
      cvSnippet: params.cvSnippet,
      activePositions: formattedActivePositions,
    });

    const aiRoutingResult = await aiProvider.generateStructured(
      routingPrompt,
      [],
      RoutingResultSchema,
      ROUTING_SYSTEM_INSTRUCTION
    );

    if (!aiRoutingResult.isJobApplication) {
      return {
        positionId: null,
        needsReview: false,
        isJobApplication: false,
        reasoning: `Dilewati oleh AI: Bukan email lamaran kerja (${aiRoutingResult.reasoning})`,
      };
    }

    const needsReview =
      aiRoutingResult.confidence < 0.6 || !aiRoutingResult.positionId;

    return {
      positionId: aiRoutingResult.positionId,
      needsReview,
      isJobApplication: true,
      reasoning: aiRoutingResult.reasoning,
    };
  } catch (err: any) {
    console.error("Gagal melakukan AI routing email:", err.message);
    // If AI fails, fallback: if matchedPositions has any, pick first with needsReview
    if (matchedPositions.length > 0) {
      return {
        positionId: matchedPositions[0].id,
        needsReview: true,
        isJobApplication: true,
        reasoning: "Routing otomatis ambigu (terdapat beberapa posisi cocok). Perlu ditinjau HR.",
      };
    }

    return {
      positionId: null,
      needsReview: true,
      isJobApplication: true,
      reasoning: "AI routing gagal dan tidak ada filter subjek yang cocok. Ditandai untuk ditinjau HR.",
    };
  }
}

/**
 * Main Gmail Synchronization Service
 */
export async function syncGmailEmails(): Promise<SyncProgressResult> {
  const result: SyncProgressResult = {
    messagesFound: 0,
    processedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
  };

  let clientContext: Awaited<ReturnType<typeof getAuthenticatedGmailClient>>;

  try {
    clientContext = await getAuthenticatedGmailClient();
  } catch (err: any) {
    console.warn("Sinkronisasi Gmail dilewati:", err.message);
    result.errors.push(err.message);
    return result;
  }

  const { gmail, account } = clientContext;

  try {
    // Determine backfill date query
    const days = account.backfillDays || 14;
    const dateLimit = account.scanAfter || new Date(Date.now() - days * 86400000);
    const deadline = Date.now() + 6 * 60000;
    const dateQuery = `after:${Math.floor(dateLimit.getTime() / 1000)}`;

    // Query Gmail for messages with attachment within backfill window
    const query = `has:attachment ${dateQuery}`;
    let pageToken = account.nextPageToken || undefined;
    let stop = false;
    do {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 20,
      pageToken,
    });

    const messages = listRes.data.messages || [];
    result.messagesFound += messages.length;

    for (const msg of messages) {
      if (Date.now() >= deadline) { stop = true; break; }
      if (!msg.id) continue;

      // Check duplicate message ID in ProcessedEmail or Candidate
      const alreadyProcessed = await prisma.processedEmail.findFirst({
        where: { messageId: msg.id },
      });
      if (alreadyProcessed) {
        result.skippedCount++;
        continue;
      }

      const existingCandidate = await prisma.candidate.findFirst({
        where: { gmailMessageId: msg.id },
      });
      if (existingCandidate) {
        result.skippedCount++;
        continue;
      }

      // Fetch full message
      try {
        const fullMsgRes = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const fullMsg = fullMsgRes.data;
        const headers = fullMsg.payload?.headers || [];
        const subjectHeader =
          headers.find((h) => h.name?.toLowerCase() === "subject")?.value ||
          "(Tanpa Subjek)";
        const fromHeader =
          headers.find((h) => h.name?.toLowerCase() === "from")?.value ||
          "(Pengirim Tidak Diketahui)";
        const dateHeader =
          headers.find((h) => h.name?.toLowerCase() === "date")?.value;
        const emailDate = dateHeader ? new Date(dateHeader) : new Date();

        const bodyText = extractEmailBody(fullMsg.payload || {});
        const attachments = findCvAttachments(fullMsg.payload?.parts || []);

        if (attachments.length === 0) {
          // No PDF or DOCX attachment -> record as skipped
          await prisma.processedEmail.create({
            data: {
              messageId: msg.id,
              subject: subjectHeader,
              sender: fromHeader,
              date: emailDate,
              actionTaken: "SKIPPED_NO_ATTACHMENT",
              reason: "Tidak ditemukan attachment berformat PDF atau DOCX.",
            },
          });
          result.skippedCount++;
          continue;
        }

        // Process first suitable attachment (or iterate if multiple)
        let processedAnyCv = false;
        let duplicateCount = 0;

        for (const att of attachments) {
          // Fetch attachment data
          const attRes = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: msg.id,
            id: att.attachmentId,
          });

          const base64Data = attRes.data.data;
          if (!base64Data) continue;

          // Convert url-safe base64 to standard buffer
          const buffer = Buffer.from(
            base64Data.replace(/-/g, "+").replace(/_/g, "/"),
            "base64"
          );

          if (buffer.length > 10 * 1024 * 1024) throw new Error("Lampiran CV melebihi batas 10 MB.");
          // Check duplicate file hash
          const fileHash = sha256(buffer);
          const duplicateHashCandidate = await prisma.candidate.findFirst({
            where: { fileHash },
          });

          if (duplicateHashCandidate) {
            duplicateCount++;
            console.log(
              `Attachment ${att.filename} memiliki hash sama dengan kandidat ${duplicateHashCandidate.id}, dilewati.`
            );
            continue;
          }

          // Parse CV document
          const docInfo = await parseCvDocument(
            buffer,
            att.filename,
            att.mimeType
          );

          // Route email to position
          const routing = await routeEmailToPosition({
            subject: subjectHeader,
            sender: fromHeader,
            bodySnippet: bodyText,
            cvFileName: att.filename,
            cvSnippet: docInfo.textSnippet,
            labels: fullMsg.labelIds || [],
          });

          if (!routing.isJobApplication) {
            await prisma.processedEmail.create({
              data: {
                messageId: msg.id,
                subject: subjectHeader,
                sender: fromHeader,
                date: emailDate,
                actionTaken: "SKIPPED_NOT_JOB_APPLICATION",
                reason: routing.reasoning,
              },
            });
            result.skippedCount++;
            break; // Stop further attachments for non-application email
          }

          // Screen Candidate CV
          await screenCandidateCv({
            fileBuffer: buffer,
            fileName: att.filename,
            mimeType: docInfo.mimeType,
            fileHash,
            extractedText: docInfo.textSnippet,
            positionId: routing.positionId,
            needsReview: routing.needsReview,
            source: "GMAIL",
            gmailMessageId: msg.id,
            emailSubject: subjectHeader,
            emailSender: fromHeader,
            emailDate,
            routingReasoning: routing.reasoning,
          });

          processedAnyCv = true;
          result.processedCount++;
          break; // Process main primary CV from this application email
        }

        if (!processedAnyCv && duplicateCount === attachments.length) {
          await prisma.processedEmail.create({ data: { messageId: msg.id, actionTaken: "SKIPPED_DUPLICATE", reason: "Semua lampiran CV sudah ada di akun ini." } });
          result.skippedCount++;
        }
        if (processedAnyCv) {
          await prisma.processedEmail.create({
            data: {
              messageId: msg.id,
              subject: subjectHeader,
              sender: fromHeader,
              date: emailDate,
              actionTaken: "PROCESSED",
              reason: "CV berhasil diekstraksi dan diskrining secara otomatis.",
            },
          });
        }
      } catch (itemErr: any) {
        console.error(`Gagal memproses pesan Gmail ${msg.id}:`, itemErr);
        result.failedCount++;
        result.errors.push(`Pesan ${msg.id}: ${itemErr.message}`);
      }
    }

    if (!stop) pageToken = listRes.data.nextPageToken || undefined;
    await prisma.gmailAccount.updateMany({ where: { id: account.id }, data: { nextPageToken: pageToken || null, scanAfter: pageToken ? dateLimit : null } });
    } while (pageToken && !stop && Date.now() < deadline);
    // Update Gmail Account last sync time
    await prisma.gmailAccount.update({
      where: { id: account.id },
      data: {
        lastSyncAt: new Date(),
        lastErrorMessage: result.errors.join("; ").slice(0, 1000) || null,
      },
    });

    // Send daily shortlist digest if enabled & newly shortlisted candidates exist
    await sendShortlistNotificationEmail();
  } catch (syncErr: any) {
    console.error("Kesalahan umum dalam syncGmailEmails:", syncErr);
    await prisma.gmailAccount.update({
      where: { id: account.id },
      data: {
        lastErrorMessage: syncErr.message,
      },
    });
    result.errors.push(syncErr.message);
    if (String(syncErr.message).includes("invalid_grant")) await prisma.gmailAccount.updateMany({ where: { id: account.id }, data: { isConnected: false } });
    if (String(syncErr.message).toLowerCase().includes("page token")) await prisma.gmailAccount.updateMany({ where: { id: account.id }, data: { nextPageToken: null, scanAfter: null } });
  }

  return result;
}

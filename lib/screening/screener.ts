import fs from "fs";
import path from "path";
import { prisma } from "../prisma";
import { aiProvider } from "../ai/gemini";
import {
  ScreeningResultSchema,
  ScreeningResult,
  AIServiceFilePart,
} from "../ai/provider";
import {
  buildScreeningPrompt,
  SCREENING_SYSTEM_INSTRUCTION,
} from "../ai/prompts";

export interface ScreenCandidateParams {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  fileHash: string;
  extractedText?: string;
  positionId?: string | null;
  needsReview?: boolean;
  source: "GMAIL" | "MANUAL_UPLOAD";
  gmailMessageId?: string | null;
  emailSubject?: string | null;
  emailSender?: string | null;
  emailDate?: Date | null;
  routingReasoning?: string | null;
}

/**
 * Saves uploaded CV file to disk for preview / download
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  fileHash: string,
  fileName: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeExt = path.extname(fileName) || ".pdf";
  const filePath = path.join(uploadDir, `${fileHash}${safeExt}`);
  if (!fs.existsSync(filePath)) {
    await fs.promises.writeFile(filePath, fileBuffer);
  }
  return filePath;
}

/**
 * Deterministically computes overall score in CODE based on Position weights
 */
export function calculateOverallScore(
  scores: { skills: number; experience: number; education: number; portfolio: number },
  weights: { weightSkills: number; weightExperience: number; weightEducation: number; weightPortfolio: number }
): number {
  const totalWeight =
    weights.weightSkills +
    weights.weightExperience +
    weights.weightEducation +
    weights.weightPortfolio;

  if (totalWeight <= 0) return 0;

  const rawScore =
    (scores.skills * weights.weightSkills +
      scores.experience * weights.weightExperience +
      scores.education * weights.weightEducation +
      scores.portfolio * weights.weightPortfolio) /
    totalWeight;

  return Math.round(rawScore * 10) / 10;
}

/**
 * Recalculates candidate final shortlist status according to Position rules
 */
export async function evaluateShortlistStatus(
  overallScore: number,
  allMustHaveMet: boolean,
  positionId: string,
  candidateId?: string
): Promise<"SHORTLIST" | "MAYBE" | "REJECT"> {
  if (!allMustHaveMet) {
    return "REJECT";
  }

  const position = await prisma.position.findUnique({
    where: { id: positionId },
  });

  if (!position) return "MAYBE";

  if (position.shortlistRuleType === "THRESHOLD") {
    return overallScore >= position.shortlistThreshold ? "SHORTLIST" : "MAYBE";
  }

  if (position.shortlistRuleType === "TOP_N") {
    // Check rank among candidates for this position
    const otherCandidates = await prisma.candidate.findMany({
      where: {
        positionId,
        id: candidateId ? { not: candidateId } : undefined,
        allMustHaveMet: true,
      },
      select: { id: true, overallScore: true },
      orderBy: { overallScore: "desc" },
    });

    const scoresList = [...otherCandidates.map((c) => c.overallScore), overallScore].sort(
      (a, b) => b - a
    );

    const rank = scoresList.indexOf(overallScore) + 1;
    return rank <= position.shortlistTopN ? "SHORTLIST" : "MAYBE";
  }

  return "MAYBE";
}

/**
 * Screens a CV using AI and updates/creates Candidate in Database
 */
export async function screenCandidateCv(
  params: ScreenCandidateParams
): Promise<any> {
  const filePath = await saveUploadedFile(
    params.fileBuffer,
    params.fileHash,
    params.fileName
  );

  let position = params.positionId
    ? await prisma.position.findUnique({ where: { id: params.positionId } })
    : null;

  // Fallback if no specific position or needs review: pick first active or default profile
  if (!position) {
    position = await prisma.position.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!position) {
    throw new Error("Tidak ada posisi yang aktif di sistem untuk melakukan screening CV.");
  }

  let mustHaves: string[] = [];
  try {
    mustHaves = JSON.parse(position.mustHaveRequirements);
  } catch {
    mustHaves = position.mustHaveRequirements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  let niceToHaves: string[] = [];
  try {
    niceToHaves = JSON.parse(position.niceToHaveRequirements);
  } catch {
    niceToHaves = position.niceToHaveRequirements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const screeningPrompt = buildScreeningPrompt({
    positionTitle: position.title,
    department: position.department,
    description: position.description,
    mustHaveRequirements: mustHaves,
    niceToHaveRequirements: niceToHaves,
    minExperienceYears: position.minExperienceYears,
    minEducation: position.minEducation,
    extractedTextFallback: params.extractedText,
  });

  const fileParts: AIServiceFilePart[] = [];

  // If PDF, send buffer directly to Gemini for visual layout inspection
  if (params.mimeType === "application/pdf") {
    fileParts.push({
      mimeType: "application/pdf",
      data: params.fileBuffer,
      fileName: params.fileName,
    });
  }

  // Call AI Provider
  const aiResult = (await aiProvider.generateStructured(
    screeningPrompt,
    fileParts,
    ScreeningResultSchema,
    SCREENING_SYSTEM_INSTRUCTION
  )) as ScreeningResult;

  // Compute deterministic overall score
  const overallScore = calculateOverallScore(aiResult.scores, {
    weightSkills: position.weightSkills,
    weightExperience: position.weightExperience,
    weightEducation: position.weightEducation,
    weightPortfolio: position.weightPortfolio,
  });

  // Verify all must-haves met
  const allMustHaveMet =
    aiResult.must_have_check.length > 0
      ? aiResult.must_have_check.every((req) => req.met === true)
      : true;

  // Calculate final status
  let finalStatus: "SHORTLIST" | "MAYBE" | "REJECT" | "NEEDS_HR_REVIEW" = "MAYBE";

  if (params.needsReview) {
    finalStatus = "NEEDS_HR_REVIEW";
  } else {
    finalStatus = await evaluateShortlistStatus(
      overallScore,
      allMustHaveMet,
      position.id
    );
  }

  // Save Candidate
  const candidate = await prisma.candidate.create({
    data: {
      positionId: position.id,
      name: aiResult.candidate.name || "Kandidat",
      email: aiResult.candidate.email || params.emailSender || "",
      phone: aiResult.candidate.phone || "",
      location: aiResult.candidate.location || "",
      totalExperienceYears: aiResult.candidate.total_experience_years || 0,
      educationList: JSON.stringify(aiResult.candidate.education || []),
      links: JSON.stringify(aiResult.candidate.links || {}),

      scoreSkills: aiResult.scores.skills,
      scoreExperience: aiResult.scores.experience,
      scoreEducation: aiResult.scores.education,
      scorePortfolio: aiResult.scores.portfolio,
      overallScore,

      mustHaveResults: JSON.stringify(aiResult.must_have_check || []),
      niceToHaveResults: JSON.stringify(aiResult.nice_to_have_check || []),
      allMustHaveMet,

      summary: aiResult.summary,
      portfolioSummary: aiResult.portfolio_summary,
      strengths: JSON.stringify(aiResult.strengths || []),
      gaps: JSON.stringify(aiResult.gaps || []),
      strongestAspect: aiResult.strongest_aspect || "skills",
      aiRecommendation: aiResult.recommendation,
      aiReasoning: aiResult.reasoning,
      aiConfidence: params.needsReview ? 0.5 : 0.95,

      status: finalStatus,
      isManualOverride: false,
      hrNotes: params.routingReasoning
        ? `Catatan Routing: ${params.routingReasoning}`
        : null,

      source: params.source,
      gmailMessageId: params.gmailMessageId,
      emailSubject: params.emailSubject,
      emailSender: params.emailSender,
      emailDate: params.emailDate,

      fileName: params.fileName,
      fileHash: params.fileHash,
      filePath,
      fileMimeType: params.mimeType,
    },
  });

  return candidate;
}

/**
 * Re-screens all candidates for a specific position (e.g. after job requirements changed)
 */
export async function rescreenPositionCandidates(positionId: string): Promise<number> {
  const candidates = await prisma.candidate.findMany({
    where: { positionId },
  });

  let count = 0;
  for (const c of candidates) {
    if (!c.filePath || !fs.existsSync(c.filePath)) continue;

    try {
      const buffer = await fs.promises.readFile(c.filePath);
      await prisma.candidate.delete({ where: { id: c.id } });

      await screenCandidateCv({
        fileBuffer: buffer,
        fileName: c.fileName,
        mimeType: c.fileMimeType,
        fileHash: c.fileHash,
        positionId,
        source: c.source as any,
        gmailMessageId: c.gmailMessageId,
        emailSubject: c.emailSubject,
        emailSender: c.emailSender,
        emailDate: c.emailDate,
      });

      count++;
    } catch (err: any) {
      console.error(`Gagal re-screen kandidat ${c.id}:`, err.message);
    }
  }

  return count;
}

import { z } from "zod";

export const EducationItemSchema = z.object({
  degree: z.string().default(""),
  institution: z.string().default(""),
  year: z.string().default(""),
});

export const CandidateLinksSchema = z.object({
  linkedin: z.string().default(""),
  portfolio: z.array(z.string()).default([]),
  github: z.string().default(""),
  other: z.array(z.string()).default([]),
});

export const CandidateInfoSchema = z.object({
  name: z.string().default("Kandidat"),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  total_experience_years: z.number().default(0),
  education: z.array(EducationItemSchema).default([]),
  links: CandidateLinksSchema.default({
    linkedin: "",
    portfolio: [],
    github: "",
    other: [],
  }),
});

export const RequirementCheckItemSchema = z.object({
  requirement: z.string(),
  met: z.boolean(),
  evidence: z.string().default("Tidak ditemukan bukti spesifik di CV"),
});

export const ScoresSchema = z.object({
  skills: z.number().min(0).max(100).default(0),
  experience: z.number().min(0).max(100).default(0),
  education: z.number().min(0).max(100).default(0),
  portfolio: z.number().min(0).max(100).default(0),
});

export const ScreeningResultSchema = z.object({
  candidate: CandidateInfoSchema,
  scores: ScoresSchema,
  must_have_check: z.array(RequirementCheckItemSchema).default([]),
  nice_to_have_check: z.array(RequirementCheckItemSchema).default([]),
  summary: z.string().default(""),
  portfolio_summary: z.string().default("Tidak ditemukan"),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  strongest_aspect: z.enum(["skills", "experience", "education", "portfolio"]).default("skills"),
  recommendation: z.enum(["SHORTLIST", "MAYBE", "REJECT"]).default("MAYBE"),
  reasoning: z.string().default(""),
});

export type ScreeningResult = z.infer<typeof ScreeningResultSchema>;

export const RoutingResultSchema = z.object({
  positionId: z.string().nullable().describe("ID posisi yang cocok atau null jika TIDAK_RELEVAN"),
  confidence: z.number().min(0).max(1).describe("Tingkat keyakinan 0.0 - 1.0"),
  isJobApplication: z.boolean().describe("Apakah email ini merupakan surat lamaran kerja nyata"),
  reasoning: z.string().describe("Penjelasan singkat rute yang dipilih"),
});

export type RoutingResult = z.infer<typeof RoutingResultSchema>;

export interface AIServiceFilePart {
  mimeType: string;
  data: Buffer;
  fileName?: string;
}

export interface AIServiceProvider {
  generateStructured<T>(
    prompt: string,
    files: AIServiceFilePart[],
    schema: z.ZodType<T>,
    schemaName?: string
  ): Promise<T>;
}

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  AIServiceFilePart,
  AIServiceProvider,
  ScreeningResultSchema,
  RoutingResultSchema,
} from "./provider";
import {
  SCREENING_SYSTEM_INSTRUCTION,
  ROUTING_SYSTEM_INSTRUCTION,
} from "./prompts";

/**
 * Gemini Provider using official @google/genai SDK
 */
export class GeminiAIProvider implements AIServiceProvider {
  private client: GoogleGenAI | null = null;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    this.defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY belum dikonfigurasi di file .env. Silakan atur GEMINI_API_KEY terlebih dahulu."
        );
      }
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Helper to strip markdown JSON ticks if the model returns ```json ... ```
   */
  private cleanJsonResponse(rawText: string): string {
    let text = rawText.trim();
    if (text.startsWith("```json")) {
      text = text.substring(7);
    } else if (text.startsWith("```")) {
      text = text.substring(3);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    return text.trim();
  }

  async generateStructured<T>(
    prompt: string,
    files: AIServiceFilePart[],
    schema: z.ZodType<T>,
    systemInstruction?: string
  ): Promise<T> {
    const client = this.getClient();
    const model = process.env.GEMINI_MODEL || this.defaultModel;

    // Convert attached files into inlineData parts for @google/genai
    const contents: any[] = [];

    for (const file of files) {
      contents.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data.toString("base64"),
        },
      });
    }

    contents.push(prompt);

    let lastError: any = null;
    const maxTries = 4;

    for (let attempt = 1; attempt <= maxTries; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction:
              systemInstruction || SCREENING_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.1, // Low temperature for consistent deterministic scoring
          },
        });

        const textOutput = response.text || "";
        if (!textOutput) {
          throw new Error("Respon kosong diterima dari Gemini AI.");
        }

        const cleaned = this.cleanJsonResponse(textOutput);
        const parsedJson = JSON.parse(cleaned);

        // Validate strictly using Zod
        const validated = schema.parse(parsedJson);
        return validated;
      } catch (err: any) {
        lastError = err;
        console.error(
          `[GeminiProvider] Percobaan ${attempt} gagal:`,
          err?.message || err
        );

        if (attempt < maxTries) {
          // If 503 / high demand or rate limit, wait longer with backoff (2.5s, 5s, 8s)
          const isOverloaded =
            err?.message?.includes("503") ||
            err?.message?.includes("high demand") ||
            err?.message?.includes("429");
          const waitTime = isOverloaded ? attempt * 2500 : attempt * 1200;
          await new Promise((res) => setTimeout(res, waitTime));
        }
      }
    }

    throw new Error(
      `Gagal menghasilkan output terstruktur dari Gemini setelah ${maxTries} percobaan. Error: ${
        lastError?.message || lastError
      }`
    );
  }
}

// Singleton instance
export const aiProvider = new GeminiAIProvider();

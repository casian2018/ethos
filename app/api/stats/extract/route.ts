import { NextRequest, NextResponse } from "next/server";
import {
  extractHealthStatsFromOcrText,
  hasAnyHealthStats,
  mergeExtractedHealthStats,
  normalizeExtractedHealthStats,
  type OcrHealthStats,
} from "@/lib/healthStats";
import { generateGeminiContent, getGeminiApiKey, getGeminiModel } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

async function extractOcrText(imageBase64: string): Promise<string> {
  const { recognize } = await import("tesseract.js");
  const buffer = Buffer.from(imageBase64, "base64");
  const result = await recognize(buffer, "eng");
  return result.data.text || "";
}

function createHealthStatsSchema() {
  return {
    type: "object",
    propertyOrdering: ["steps", "calories", "distanceKm", "activeMinutes", "source"],
    properties: {
      steps: { type: "number", minimum: 0, maximum: 200000 },
      calories: { type: "number", minimum: 0, maximum: 20000 },
      distanceKm: { type: "number", minimum: 0, maximum: 500 },
      activeMinutes: { type: "number", minimum: 0, maximum: 1440 },
      source: { type: "string" },
    },
    required: ["steps", "calories", "distanceKm", "activeMinutes", "source"],
    additionalProperties: false,
  } as const;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageBase64?: string;
      imageMimeType?: string;
    };

    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const imageMimeType = typeof body.imageMimeType === "string" ? body.imageMimeType.trim() : "";

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({ error: "Missing screenshot payload." }, { status: 400 });
    }

    let ocrText = "";
    let ocrStats: OcrHealthStats = {
      ...normalizeExtractedHealthStats({}),
      stepConfidence: "none",
      clues: [],
    };

    try {
      ocrText = await extractOcrText(imageBase64);
      ocrStats = extractHealthStatsFromOcrText(ocrText);
    } catch (error) {
      console.error("Health OCR extraction failed:", error);
    }

    if (!getGeminiApiKey()) {
      if (hasAnyHealthStats(ocrStats)) {
        return NextResponse.json({ stats: ocrStats, source: "ocr-fallback" });
      }

      return NextResponse.json({ error: "Gemini API key is missing." }, { status: 503 });
    }

    const prompt = `
Analyze this health or fitness app screenshot and extract the visible activity metrics.

Return only JSON with these fields:
- steps
- calories
- distanceKm
- activeMinutes
- source

Rules:
- Use 0 if a metric is not clearly visible.
- Use kilometers for distance.
- Keep source short, for example Apple Health, Samsung Health, Garmin, Fitbit, or Other.
- Preserve grouped digits exactly. If the screenshot shows 16,608 steps, return 16608, not 6608 or 608.
- If the OCR helper text contains a clearly labeled steps value, prefer that exact number.

OCR helper text from the same screenshot:
${ocrText || "No OCR text available."}
    `.trim();

    const response = await generateGeminiContent({
      model: getGeminiModel("gemini-2.5-flash"),
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: imageMimeType,
            data: imageBase64,
          },
        },
      ],
      temperature: 0.1,
      responseMimeType: "application/json",
      responseJsonSchema: createHealthStatsSchema(),
    });

    if (!response.ok || !response.text) {
      if (hasAnyHealthStats(ocrStats)) {
        return NextResponse.json({ stats: ocrStats, source: "ocr-fallback" });
      }

      return NextResponse.json({ error: "Failed to analyze image." }, { status: 502 });
    }

    const stats = mergeExtractedHealthStats(JSON.parse(response.text) as Record<string, unknown>, ocrStats);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error extracting health stats:", error);
    return NextResponse.json({ error: "Failed to analyze image." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateGeminiContent, getGeminiApiKey, getGeminiModel } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

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

    if (!getGeminiApiKey()) {
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
      return NextResponse.json({ error: "Failed to analyze image." }, { status: 502 });
    }

    const stats = JSON.parse(response.text) as Record<string, unknown>;
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error extracting health stats:", error);
    return NextResponse.json({ error: "Failed to analyze image." }, { status: 500 });
  }
}

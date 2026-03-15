import { NextRequest, NextResponse } from "next/server";
import { extractSleepAnalysisFromOcrText, normalizeSleepScreenshotAnalysis } from "@/lib/sleep";
import { generateGeminiContent, getGeminiApiKey, getGeminiModel } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

async function extractOcrText(imageBase64: string): Promise<string> {
  const { recognize } = await import("tesseract.js");
  const buffer = Buffer.from(imageBase64, "base64");
  const result = await recognize(buffer, "eng");
  return result.data.text || "";
}

function createSleepAnalysisSchema() {
  return {
    type: "object",
    propertyOrdering: [
      "dateText",
      "asleepTime",
      "awakeTime",
      "totalSleepMinutes",
      "timeInBedMinutes",
      "deepSleepMinutes",
      "lightSleepMinutes",
      "remSleepMinutes",
      "awakeMinutes",
      "efficiency",
      "sourceApp",
      "confidence",
      "visibleClues",
      "notes",
    ],
    properties: {
      dateText: { type: "string" },
      asleepTime: { type: "string" },
      awakeTime: { type: "string" },
      totalSleepMinutes: { type: "number", minimum: 0, maximum: 960 },
      timeInBedMinutes: { type: "number", minimum: 0, maximum: 1080 },
      deepSleepMinutes: { type: "number", minimum: 0, maximum: 360 },
      lightSleepMinutes: { type: "number", minimum: 0, maximum: 720 },
      remSleepMinutes: { type: "number", minimum: 0, maximum: 360 },
      awakeMinutes: { type: "number", minimum: 0, maximum: 240 },
      efficiency: { type: "number", minimum: 0, maximum: 100 },
      sourceApp: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      visibleClues: {
        type: "array",
        items: { type: "string" },
        minItems: 0,
        maxItems: 8,
      },
      notes: {
        type: "array",
        items: { type: "string" },
        minItems: 0,
        maxItems: 6,
      },
    },
    required: [
      "dateText",
      "asleepTime",
      "awakeTime",
      "totalSleepMinutes",
      "timeInBedMinutes",
      "deepSleepMinutes",
      "lightSleepMinutes",
      "remSleepMinutes",
      "awakeMinutes",
      "efficiency",
      "sourceApp",
      "confidence",
      "visibleClues",
      "notes",
    ],
    additionalProperties: false,
  } as const;
}

export async function POST(request: NextRequest) {
  let imageBase64 = "";
  let imageMimeType = "";
  let language: "ro" | "en" = "ro";

  try {
    const body = (await request.json()) as {
      imageBase64?: string;
      imageMimeType?: string;
      language?: "ro" | "en";
    };

    imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
    imageMimeType = typeof body.imageMimeType === "string" ? body.imageMimeType.trim() : "";
    language = body.language === "en" ? "en" : "ro";

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json(
        {
          error: language === "ro" ? "Lipsește imaginea pentru analiză." : "The screenshot is missing.",
        },
        { status: 400 }
      );
    }

    let ocrText = "";
    let ocrAnalysis = null;

    try {
      ocrText = await extractOcrText(imageBase64);
      ocrAnalysis = extractSleepAnalysisFromOcrText(ocrText, { language });
      if (ocrAnalysis && ocrAnalysis.confidence !== "low") {
        return NextResponse.json({ analysis: ocrAnalysis, source: "ocr" });
      }
    } catch (error) {
      console.error("Sleep OCR fallback failed:", error);
    }

    if (!getGeminiApiKey()) {
      if (ocrAnalysis) {
        return NextResponse.json({ analysis: ocrAnalysis, source: "ocr-fallback" });
      }

      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Cheia Gemini lipsește pentru analiza somnului."
              : "A Gemini API key is required for sleep analysis.",
        },
        { status: 503 }
      );
    }

    const prompt = `
Analyze this sleep tracker screenshot and extract only the sleep values that are visibly supported by the image.

Important rules:
- Read the visible date shown in the screenshot. It may appear as month/day or day/month.
- Read the exact sleep interval shown, for example 05:21 - 09:41.
- Extract stage durations only if they are visible: deep, light, REM, awake.
- totalSleepMinutes should represent actual sleep time, excluding awake time when the screenshot separates it.
- timeInBedMinutes should be sleep + awake when visible. If not visible, estimate from the interval.
- Use 24-hour times in HH:MM format.
- If a value is not visible, use 0 for numbers and an empty string for text, then mention uncertainty in notes.
- sourceApp should be a short label like Samsung Health, Apple Health, Fitbit, Garmin, or Sleep tracker.
- visibleClues should list the exact short clues you relied on from the screenshot.
- Return only JSON.

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
      responseJsonSchema: createSleepAnalysisSchema(),
    });

    if (!response.ok || !response.text) {
      if (ocrAnalysis) {
        return NextResponse.json({ analysis: ocrAnalysis, source: "ocr-fallback" });
      }

      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Nu am putut interpreta screenshot-ul de somn."
              : "The sleep screenshot could not be interpreted.",
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(response.text) as Record<string, unknown>;
    const analysis = normalizeSleepScreenshotAnalysis(parsed);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error analyzing sleep screenshot:", error);

    try {
      if (imageBase64) {
        const ocrText = await extractOcrText(imageBase64);
        const analysis = extractSleepAnalysisFromOcrText(ocrText, {
          language,
        });
        if (analysis) {
          return NextResponse.json({ analysis, source: "ocr-fallback" });
        }
      }
    } catch (ocrError) {
      console.error("Sleep OCR recovery failed:", ocrError);
    }

    return NextResponse.json(
      {
        error: "Failed to analyze sleep screenshot.",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  buildNutritionAnalysisPrompt,
  createNutritionAnalysisSchema,
  fallbackAnalyzeNutrition,
  normalizeNutritionAnalysis,
  type NutritionAnalysisSource,
} from "@/lib/nutrition";
import { generateGeminiContent, getGeminiApiKey, getGeminiModel } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      description?: string;
      quantityText?: string;
      imageBase64?: string;
      imageMimeType?: string;
      language?: "ro" | "en";
      dietaryPreference?: string;
      allergies?: string[];
      foodsToAvoid?: string[];
    };

    const description = body.description?.trim() || "";
    const quantityText = body.quantityText?.trim() || "";
    const imageBase64 = body.imageBase64?.trim() || "";
    const imageMimeType = body.imageMimeType?.trim() || "";
    const language = body.language === "en" ? "en" : "ro";
    const hasImage = Boolean(imageBase64 && imageMimeType);

    if (!description && !hasImage) {
      return NextResponse.json(
        {
          error: language === "ro" ? "Trimite un text sau o poză cu masa." : "Send a text description or a meal photo.",
        },
        { status: 400 }
      );
    }

    if (!getGeminiApiKey()) {
      if (description) {
        return NextResponse.json({
          analysis: fallbackAnalyzeNutrition({ description, quantityText, language }),
          usedFallback: true,
          warning:
            language === "ro"
              ? "Cheia Gemini lipsește. A fost folosită o estimare locală."
              : "Gemini API key is missing. A local estimate was used.",
        });
      }

      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Pentru analiză din poză trebuie configurată cheia Gemini."
              : "A Gemini API key is required for photo analysis.",
        },
        { status: 503 }
      );
    }

    const prompt = buildNutritionAnalysisPrompt({
      description,
      quantityText,
      hasImage,
      language,
      dietaryPreference: body.dietaryPreference,
      allergies: body.allergies,
      foodsToAvoid: body.foodsToAvoid,
    });

    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];
    if (hasImage) {
      parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64,
        },
      });
    }

    const source: NutritionAnalysisSource = hasImage
      ? description
        ? "gemini-multimodal"
        : "gemini-image"
      : "gemini-text";

    const response = await generateGeminiContent({
      model: getGeminiModel("gemini-2.5-flash"),
      parts,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseJsonSchema: createNutritionAnalysisSchema(),
    });

    if (!response.ok) {
      if (description) {
        return NextResponse.json({
          analysis: fallbackAnalyzeNutrition({ description, quantityText, language }),
          usedFallback: true,
          warning:
            language === "ro"
              ? "Gemini nu a răspuns corect. A fost folosită o estimare locală."
              : "Gemini did not respond correctly. A local estimate was used.",
        });
      }

      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Analiza imaginii a eșuat. Încearcă o poză mai clară sau adaugă text."
              : "Image analysis failed. Try a clearer photo or add text.",
        },
        { status: 502 }
      );
    }

    if (!response.text) {
      if (description) {
        return NextResponse.json({
          analysis: fallbackAnalyzeNutrition({ description, quantityText, language }),
          usedFallback: true,
          warning:
            language === "ro"
              ? "Gemini a returnat un răspuns gol. A fost folosită o estimare locală."
              : "Gemini returned an empty response. A local estimate was used.",
        });
      }

      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Nu s-a putut interpreta masa din poză."
              : "The meal could not be interpreted from the photo.",
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(response.text) as Record<string, unknown>;
    const analysis = normalizeNutritionAnalysis(parsed, {
      description,
      quantityText,
      language,
      source,
    });

    return NextResponse.json({ analysis, usedFallback: false });
  } catch (error) {
    console.error("Error analyzing nutrition:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze meal.",
      },
      { status: 500 }
    );
  }
}

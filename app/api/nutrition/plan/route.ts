import { NextRequest, NextResponse } from "next/server";
import {
  buildFallbackMealPlan,
  buildMealPlanPrompt,
  createNutritionMealPlanSchema,
  normalizeNutritionMealPlan,
} from "@/lib/nutrition";
import type { DetailedUserProfile, NutritionTargets } from "@/lib/profile";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function extractGeneratedText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      profile?: DetailedUserProfile;
      targets?: NutritionTargets;
      language?: "ro" | "en";
    };

    const profile = body.profile;
    const targets = body.targets;
    const language = body.language === "en" ? "en" : "ro";

    if (!profile || !targets) {
      return NextResponse.json({ error: "Missing nutrition profile context." }, { status: 400 });
    }

    const fallbackPlan = buildFallbackMealPlan(profile, targets, language);
    const mealCount = Math.min(Math.max(profile.mealsPerDay || 4, 3), 6);

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        plan: fallbackPlan,
        usedFallback: true,
        warning:
          language === "ro"
            ? "Cheia Gemini lipsește. A fost generat planul fallback din profil."
            : "Gemini API key is missing. A fallback plan was generated from the profile.",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildMealPlanPrompt(profile, targets, language) }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseJsonSchema: createNutritionMealPlanSchema(mealCount),
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        plan: fallbackPlan,
        usedFallback: true,
        warning:
          language === "ro"
            ? "Gemini nu a putut genera planul. A fost folosit planul fallback."
            : "Gemini could not generate the plan. A fallback plan was used.",
      });
    }

    const geminiPayload = await response.json();
    const generatedText = extractGeneratedText(geminiPayload);

    if (!generatedText) {
      return NextResponse.json({
        plan: fallbackPlan,
        usedFallback: true,
        warning:
          language === "ro"
            ? "Gemini a returnat un răspuns gol. A fost folosit planul fallback."
            : "Gemini returned an empty response. A fallback plan was used.",
      });
    }

    const parsed = JSON.parse(generatedText) as Record<string, unknown>;
    const plan = normalizeNutritionMealPlan(parsed, fallbackPlan);

    return NextResponse.json({
      plan: {
        ...plan,
        dailyTargets: fallbackPlan.dailyTargets,
      },
      usedFallback: false,
    });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate meal plan.",
      },
      { status: 500 }
    );
  }
}

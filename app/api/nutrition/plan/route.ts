import { NextRequest, NextResponse } from "next/server";
import {
  buildFallbackMealPlan,
  buildMealPlanPrompt,
  createNutritionMealPlanSchema,
  normalizeNutritionMealPlan,
} from "@/lib/nutrition";
import { generateGeminiContent, getGeminiApiKey, getGeminiModel } from "@/lib/server/gemini";
import type { DetailedUserProfile, NutritionTargets } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 30;

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

    if (!getGeminiApiKey()) {
      return NextResponse.json({
        plan: fallbackPlan,
        usedFallback: true,
        warning:
          language === "ro"
            ? "Cheia Gemini lipsește. A fost generat planul fallback din profil."
            : "Gemini API key is missing. A fallback plan was generated from the profile.",
      });
    }

    const response = await generateGeminiContent({
      model: getGeminiModel("gemini-2.5-flash"),
      parts: [{ text: buildMealPlanPrompt(profile, targets, language) }],
      temperature: 0.4,
      responseMimeType: "application/json",
      responseJsonSchema: createNutritionMealPlanSchema(mealCount),
    });

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

    if (!response.text) {
      return NextResponse.json({
        plan: fallbackPlan,
        usedFallback: true,
        warning:
          language === "ro"
            ? "Gemini a returnat un răspuns gol. A fost folosit planul fallback."
            : "Gemini returned an empty response. A fallback plan was used.",
      });
    }

    const parsed = JSON.parse(response.text) as Record<string, unknown>;
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

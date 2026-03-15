import { NextRequest, NextResponse } from "next/server";
import { buildWorkoutProfileContext, getProfileHeadline, type DetailedUserProfile } from "@/lib/profile";
import { generateGeminiContent, getGeminiApiKey, getGeminiModel } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

function createWorkoutSchema() {
  return {
    type: "object",
    propertyOrdering: ["type", "intensity", "duration", "exercises"],
    properties: {
      type: { type: "string" },
      intensity: { type: "string" },
      duration: { type: "number", minimum: 10, maximum: 180 },
      exercises: {
        type: "array",
        minItems: 3,
        maxItems: 12,
        items: {
          type: "object",
          propertyOrdering: [
            "name",
            "sets",
            "reps",
            "duration",
            "rest",
            "muscleGroup",
            "tips",
            "mistakes",
            "workInterval",
            "restInterval",
            "holdTime",
            "breathing",
          ],
          properties: {
            name: { type: "string" },
            sets: { type: "number" },
            reps: { type: "string" },
            duration: { type: "string" },
            rest: { type: "string" },
            muscleGroup: { type: "string" },
            tips: { type: "array", items: { type: "string" } },
            mistakes: { type: "array", items: { type: "string" } },
            workInterval: { type: "string" },
            restInterval: { type: "string" },
            holdTime: { type: "string" },
            breathing: { type: "string" },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    },
    required: ["type", "intensity", "duration", "exercises"],
    additionalProperties: false,
  } as const;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      profile?: DetailedUserProfile;
      workoutType?: string;
      intensity?: string;
      duration?: number;
    };

    const profile = body.profile;
    const workoutType = typeof body.workoutType === "string" ? body.workoutType.trim() : "";
    const intensity = typeof body.intensity === "string" ? body.intensity.trim() : "";
    const duration = Number.isFinite(body.duration) ? Math.round(body.duration as number) : 0;

    if (!profile || !workoutType || !intensity || duration <= 0) {
      return NextResponse.json({ error: "Missing workout generation context." }, { status: 400 });
    }

    if (!getGeminiApiKey()) {
      return NextResponse.json({ error: "Gemini API key is missing." }, { status: 503 });
    }

    const prompt = `
You are a professional fitness coach. Build a single workout session.

Detailed athlete context:
${buildWorkoutProfileContext(profile)}

Session request:
- Type: ${workoutType}
- Intensity: ${intensity}
- Duration: ${duration} minutes
- Athlete name: ${getProfileHeadline(profile)}

Rules:
- Respect all injuries and medical conditions.
- Use the available equipment and training environment.
- Match the session to the priority goal: ${profile.priorityGoal}.
- Adjust volume if sleep is low (${profile.sleepHours}h) or stress is high (${profile.stressLevel}).
- Make the plan realistic for ${profile.daysPerWeek} sessions per week.
- Return only exercises that are safe for the athlete profile.
    `.trim();

    const response = await generateGeminiContent({
      model: getGeminiModel("gemini-2.5-flash"),
      parts: [{ text: prompt }],
      temperature: 0.45,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
      responseJsonSchema: createWorkoutSchema(),
    });

    if (!response.ok || !response.text) {
      return NextResponse.json({ error: "Failed to generate workout." }, { status: 502 });
    }

    const workout = JSON.parse(response.text) as Record<string, unknown>;
    return NextResponse.json({ workout });
  } catch (error) {
    console.error("Error generating workout:", error);
    return NextResponse.json({ error: "Failed to generate workout." }, { status: 500 });
  }
}

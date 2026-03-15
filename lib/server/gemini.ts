export interface GeminiContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GenerateGeminiContentOptions {
  parts: GeminiContentPart[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseJsonSchema?: unknown;
}

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
}

export function getGeminiModel(fallback = "gemini-2.5-flash"): string {
  return process.env.GEMINI_MODEL || fallback;
}

export function extractGeminiText(payload: unknown): string {
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

export async function generateGeminiContent({
  parts,
  model,
  temperature,
  maxOutputTokens,
  responseMimeType,
  responseJsonSchema,
}: GenerateGeminiContentOptions): Promise<{
  ok: boolean;
  status: number;
  payload: unknown;
  text: string;
}> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API key.");
  }

  const generationConfig: Record<string, unknown> = {};
  if (typeof temperature === "number") {
    generationConfig.temperature = temperature;
  }
  if (typeof maxOutputTokens === "number") {
    generationConfig.maxOutputTokens = maxOutputTokens;
  }
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }
  if (responseJsonSchema) {
    generationConfig.responseJsonSchema = responseJsonSchema;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || getGeminiModel()}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig,
      }),
      cache: "no-store",
    }
  );

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
    text: extractGeminiText(payload),
  };
}

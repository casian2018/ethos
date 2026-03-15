import { NextRequest, NextResponse } from "next/server";
import { normalizeOpenFoodFactsProduct } from "@/lib/nutrition";

export const runtime = "nodejs";
export const maxDuration = 15;

function normalizeBarcode(value: string): string {
  return value.replace(/\D/g, "").trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get("code") || "";
    const barcode = normalizeBarcode(rawCode);
    const language = searchParams.get("language") === "en" ? "en" : "ro";

    if (barcode.length < 8) {
      return NextResponse.json(
        {
          error: language === "ro" ? "Codul de bare este invalid." : "The barcode is invalid.",
        },
        { status: 400 }
      );
    }

    const fields = [
      "product_name",
      "product_name_en",
      "brands",
      "image_front_url",
      "image_url",
      "serving_size",
      "nutriscore_grade",
      "nova_group",
      "nutriments",
    ].join(",");

    const response = await fetch(
      `https://world.openfoodfacts.net/api/v2/product/${barcode}?fields=${encodeURIComponent(fields)}`,
      {
        headers: {
          "User-Agent": "Ethos Nutrition Lookup/1.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Serviciul de produse nu este disponibil acum."
              : "The product service is unavailable right now.",
        },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as {
      status?: number;
      product?: Record<string, unknown>;
    };

    if (!payload.product || payload.status === 0) {
      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Produsul nu a fost găsit pentru acest cod de bare."
              : "No product was found for this barcode.",
        },
        { status: 404 }
      );
    }

    const product = normalizeOpenFoodFactsProduct(payload.product, barcode, language);
    if (!product) {
      return NextResponse.json(
        {
          error:
            language === "ro"
              ? "Produsul a fost găsit, dar informațiile nutriționale sunt incomplete."
              : "The product was found, but the nutrition data is incomplete.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error looking up barcode:", error);
    return NextResponse.json(
      {
        error: "Failed to look up barcode.",
      },
      { status: 500 }
    );
  }
}

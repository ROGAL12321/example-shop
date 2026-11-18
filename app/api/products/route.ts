import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { mapProduct, productInputSchema } from "@/lib/products";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().trim().max(150).default(""),
  category: z.string().trim().max(80).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(["newest", "price_asc", "price_desc", "name_asc"]).default("newest"),
});

const sortColumns = {
  newest: "created_at DESC, id DESC",
  price_asc: "price ASC, id DESC",
  price_desc: "price DESC, id DESC",
  name_asc: "name ASC, id DESC",
} as const;

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return jsonError("Nieprawidłowe parametry wyszukiwania", 400, z.treeifyError(parsed.error));

  const { q, category, page, limit, sort } = parsed.data;
  const offset = (page - 1) * limit;
  try {
    const sql = getDb();
    // Zapytanie parametryzowane; sortowanie ograniczone do stałej listy.
    const orderBy = sortColumns[sort];
    const items = await sql.query(
      `SELECT id, name, description, category, price, currency, stock, image_url, sku, created_at
       FROM products
       WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' OR sku ILIKE '%' || $1 || '%')
         AND ($2 = '' OR category = $2)
       ORDER BY ${orderBy}
       LIMIT $3 OFFSET $4`,
      [q, category, limit, offset]
    );
    const countRows = await sql.query(
      `SELECT COUNT(*)::int AS total FROM products
       WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' OR sku ILIKE '%' || $1 || '%')
         AND ($2 = '' OR category = $2)`,
      [q, category]
    );
    const total = Number(countRows[0]?.total ?? 0);
    return NextResponse.json({ data: items.map(mapProduct), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/products", error);
    return jsonError("Nie udało się pobrać produktów. Sprawdź konfigurację bazy danych.", 503);
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.PRODUCTS_API_KEY;
  if (!secret) return jsonError("Brak PRODUCTS_API_KEY po stronie serwera", 503);
  const provided = request.headers.get("x-api-key") ?? "";
  const expectedBytes = Buffer.from(secret);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    return jsonError("Brak dostępu. Podaj prawidłowy nagłówek x-api-key.", 401);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return jsonError("Wymagany Content-Type: application/json", 415);
  let raw: unknown;
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 32_768) return jsonError("Zbyt duże żądanie", 413);
    const body = await request.text();
    if (body.length > 32_768) return jsonError("Zbyt duże żądanie", 413);
    raw = JSON.parse(body);
  } catch {
    return jsonError("Nieprawidłowy JSON", 400);
  }
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Nieprawidłowe dane produktu", 400, z.treeifyError(parsed.error));

  const { name, description, category, price, currency, stock, imageUrl, sku } = parsed.data;
  try {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO products (name, description, category, price, currency, stock, image_url, sku)
      VALUES (${name}, ${description}, ${category}, ${price}, ${currency}, ${stock}, ${imageUrl}, ${sku})
      RETURNING id, name, description, category, price, currency, stock, image_url, sku, created_at
    `;
    return NextResponse.json({ data: mapProduct(rows[0]) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "23505") return jsonError("Produkt o podanym SKU już istnieje", 409);
    console.error("POST /api/products", error);
    return jsonError("Nie udało się dodać produktu. Sprawdź konfigurację bazy danych.", 503);
  }
}

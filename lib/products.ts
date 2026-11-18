import { z } from "zod";

export const categories = ["Elektronika", "Dom i ogród", "Sport", "Moda", "Biuro", "Inne"] as const;

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Nazwa musi mieć co najmniej 2 znaki").max(120),
  description: z.string().trim().max(2000).default(""),
  category: z.enum(categories),
  price: z.number().finite().nonnegative().max(99999999.99).refine((x) => Math.round(x * 100) === x * 100, "Cena może mieć maksymalnie 2 miejsca po przecinku"),
  currency: z.literal("PLN").default("PLN"),
  stock: z.number().int().min(0).max(1000000),
  imageUrl: z.union([z.url().startsWith("https://"), z.literal("")]).default(""),
  sku: z.string().trim().min(2).max(64).regex(/^[a-zA-Z0-9_-]+$/, "SKU może zawierać litery, cyfry, _ i -")
}).strict();

export type ProductInput = z.infer<typeof productInputSchema>;

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: "PLN";
  stock: number;
  imageUrl: string;
  sku: string;
  createdAt: string;
};

export function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    category: String(row.category),
    price: Number(row.price),
    currency: "PLN",
    stock: Number(row.stock),
    imageUrl: String(row.image_url ?? ""),
    sku: String(row.sku),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export type Product = {
  id: string;
  name: string;
  series: string;
  card_number: string | null;
  series_number: string | null;
  price_inr: number;
  condition_note: string;
  badge: string;
  stock_qty: number;
  image_url: string | null;
  created_at: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error("Missing Supabase URL or publishable key.");
}

const supabase = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const getPublishedProduct = cache(
  async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, series, card_number, series_number, price_inr, condition_note, badge, stock_qty, image_url, created_at",
      )
      .eq("id", id)
      .eq("published", true)
      .gt("stock_qty", 0)
      .maybeSingle();

    if (error) throw new Error(`Could not load product: ${error.message}`);
    return data as Product | null;
  },
);

export const getPublishedProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, series, card_number, series_number, price_inr, condition_note, badge, stock_qty, image_url, created_at",
    )
    .eq("published", true)
    .gt("stock_qty", 0)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data ?? []) as Product[];
});

import { query, queryOne, insert, execute } from "./db";

export interface Offer {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface OfferInput {
  title: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: number;
}

export async function getAllOffers(): Promise<Offer[]> {
  const sql =
    "SELECT * FROM offers ORDER BY is_active DESC, created_at DESC, id DESC";
  return await query<Offer>(sql);
}

export async function getOfferById(id: number): Promise<Offer | null> {
  const sql = "SELECT * FROM offers WHERE id = ?";
  return await queryOne<Offer>(sql, [id]);
}

export async function addOffer(offer: OfferInput): Promise<number> {
  const sql = `
    INSERT INTO offers (title, description, image_url, is_active)
    VALUES (?, ?, ?, ?)
  `;
  return await insert(sql, [
    offer.title,
    offer.description || null,
    offer.image_url || null,
    offer.is_active ?? 1,
  ]);
}

export async function updateOffer(
  id: number,
  updates: OfferInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(updates.image_url);
  }
  if (updates.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.is_active);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const sql = `UPDATE offers SET ${fields.join(", ")} WHERE id = ?`;
  const affectedRows = await execute(sql, values);
  return affectedRows > 0;
}

export async function deleteOffer(id: number): Promise<boolean> {
  const sql = "DELETE FROM offers WHERE id = ?";
  const affectedRows = await execute(sql, [id]);
  return affectedRows > 0;
}



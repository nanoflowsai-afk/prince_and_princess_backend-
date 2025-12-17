import { query, queryOne, insert, execute } from "./db";

export interface HomepageHighlight {
  id: number;
  title: string;
  subtitle: string | null;
  icon_type: "icon" | "image";
  icon_value: string | null;
  image_url: string | null;
  is_active: number;
  display_order: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface HomepageHighlightInput {
  title: string;
  subtitle?: string | null;
  icon_type?: "icon" | "image";
  icon_value?: string | null;
  image_url?: string | null;
  is_active?: number;
  display_order?: number | null;
}

export async function getAllHomepageHighlights(): Promise<HomepageHighlight[]> {
  const sql =
    "SELECT * FROM homepage_highlights ORDER BY display_order ASC, id ASC";
  return await query<HomepageHighlight>(sql);
}

export async function getHomepageHighlightById(
  id: number
): Promise<HomepageHighlight | null> {
  const sql = "SELECT * FROM homepage_highlights WHERE id = ?";
  return await queryOne<HomepageHighlight>(sql, [id]);
}

export async function addHomepageHighlight(
  highlight: HomepageHighlightInput
): Promise<number> {
  const sql = `
    INSERT INTO homepage_highlights (title, subtitle, icon_type, icon_value, image_url, is_active, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  return await insert(sql, [
    highlight.title,
    highlight.subtitle || null,
    highlight.icon_type || "icon",
    highlight.icon_value || null,
    highlight.image_url || null,
    highlight.is_active ?? 1,
    highlight.display_order ?? null,
  ]);
}

export async function updateHomepageHighlight(
  id: number,
  updates: HomepageHighlightInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.subtitle !== undefined) {
    fields.push("subtitle = ?");
    values.push(updates.subtitle);
  }
  if (updates.icon_type !== undefined) {
    fields.push("icon_type = ?");
    values.push(updates.icon_type);
  }
  if (updates.icon_value !== undefined) {
    fields.push("icon_value = ?");
    values.push(updates.icon_value);
  }
  if (updates.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(updates.image_url);
  }
  if (updates.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.is_active);
  }
  if (updates.display_order !== undefined) {
    fields.push("display_order = ?");
    values.push(updates.display_order);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const sql = `UPDATE homepage_highlights SET ${fields.join(
    ", "
  )} WHERE id = ?`;
  const affectedRows = await execute(sql, values);
  return affectedRows > 0;
}

export async function deleteHomepageHighlight(id: number): Promise<boolean> {
  const sql = "DELETE FROM homepage_highlights WHERE id = ?";
  const affectedRows = await execute(sql, [id]);
  return affectedRows > 0;
}



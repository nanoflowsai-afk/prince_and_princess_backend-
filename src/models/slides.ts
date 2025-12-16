import { query, queryOne, insert, execute } from "./db";

export interface Slide {
  id: number;
  title: string;
  description: string | null;
  image: string;
  date: string | null;
  category: string | null;
  type: "special" | "normal";
  created_at?: Date;
  updated_at?: Date;
}

export interface SlideInput {
  title: string;
  description?: string | null;
  image: string;
  date?: string | null;
  category?: string | null;
  type: "special" | "normal";
}

// Get all slides by type
export async function getSlidesByType(
  type: "special" | "normal"
): Promise<Slide[]> {
  const sql = "SELECT * FROM slides WHERE type = ? ORDER BY created_at DESC";
  return await query<Slide>(sql, [type]);
}

// Get all slides
export async function getAllSlides(): Promise<{ special: Slide[]; normal: Slide[] }> {
  const special = await getSlidesByType("special");
  const normal = await getSlidesByType("normal");
  return { special, normal };
}

// Get slide by ID
export async function getSlideById(id: number): Promise<Slide | null> {
  const sql = "SELECT * FROM slides WHERE id = ?";
  return await queryOne<Slide>(sql, [id]);
}

// Add slide
export async function addSlide(slide: SlideInput): Promise<number> {
  const sql = `
    INSERT INTO slides (title, description, image, date, category, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  return await insert(sql, [
    slide.title,
    slide.description || null,
    slide.image,
    slide.date || null,
    slide.category || null,
    slide.type,
  ]);
}

// Update slide
export async function updateSlide(
  id: number,
  type: "special" | "normal",
  updates: Partial<SlideInput>
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
  if (updates.image !== undefined) {
    fields.push("image = ?");
    values.push(updates.image);
  }
  if (updates.date !== undefined) {
    fields.push("date = ?");
    values.push(updates.date);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.type !== undefined) {
    fields.push("type = ?");
    values.push(updates.type);
  }

  if (fields.length === 0) return false;

  values.push(id, type);
  const sql = `UPDATE slides SET ${fields.join(", ")} WHERE id = ? AND type = ?`;
  const affectedRows = await execute(sql, values);
  return affectedRows > 0;
}

// Delete slide
export async function deleteSlide(
  id: number,
  type: "special" | "normal"
): Promise<boolean> {
  const sql = "DELETE FROM slides WHERE id = ? AND type = ?";
  const affectedRows = await execute(sql, [id, type]);
  return affectedRows > 0;
}


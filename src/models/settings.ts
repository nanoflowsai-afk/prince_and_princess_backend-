import { query, queryOne, insert, execute } from "./db";

// Get setting by key
export async function getSetting(key: string): Promise<string | null> {
  const sql = "SELECT setting_value FROM settings WHERE setting_key = ?";
  const result = await queryOne<{ setting_value: string }>(sql, [key]);
  return result ? result.setting_value : null;
}

// Set setting
export async function setSetting(key: string, value: string): Promise<boolean> {
  const sql = `
    INSERT INTO settings (setting_key, setting_value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE setting_value = ?
  `;
  const affectedRows = await execute(sql, [key, value, value]);
  return affectedRows > 0;
}

// Get all settings
export async function getAllSettings(): Promise<Record<string, any>> {
  const sql = "SELECT setting_key, setting_value FROM settings";
  const results = await query<{ setting_key: string; setting_value: string }>(sql);
  const settings: Record<string, any> = {};
  
  for (const row of results) {
    try {
      settings[row.setting_key] = JSON.parse(row.setting_value);
    } catch {
      settings[row.setting_key] = row.setting_value;
    }
  }
  
  return settings;
}

// Initialize default settings
export async function initializeSettings(): Promise<void> {
  const defaults: Record<string, string> = {
    "storeName": JSON.stringify("Prince and Princess"),
    "maintenanceMode": JSON.stringify(false),
    "adminAvatar": JSON.stringify(""),
    "invoice.storeName": JSON.stringify("Prince and Princess"),
    "invoice.logo": JSON.stringify("https://placehold.co/150x50?text=KidsStore"),
    "invoice.taxPercentage": JSON.stringify(10),
    "invoice.shippingCharge": JSON.stringify(15),
    "invoice.footerText": JSON.stringify("Thank you for shopping with us!"),
    "invoice.address": JSON.stringify("123 Rainbow Road, Toy Town"),
    "invoice.email": JSON.stringify("hello@princeandprincess.com"),
    "invoice.phone": JSON.stringify("+1 (555) 123-4567"),
    "notifications.New Order Received": JSON.stringify(true),
    "notifications.Product Low Stock Alert": JSON.stringify(true),
    "notifications.New User Registration": JSON.stringify(true),
    "notifications.Refund Request": JSON.stringify(true),
    "notifications.Daily Summary Email": JSON.stringify(true),
  };

  for (const [key, value] of Object.entries(defaults)) {
    await setSetting(key, value);
  }
}


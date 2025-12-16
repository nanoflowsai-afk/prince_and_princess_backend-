import { query, queryOne, insert, execute } from "./db.js";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create OTP for email
export async function createOTP(email, expiresInMinutes = 10) {
  // Delete any existing unused OTPs for this email
  await execute(
    "DELETE FROM otp_verifications WHERE email = ? AND used = false",
    [email.toLowerCase().trim()]
  );

  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  await insert(
    "INSERT INTO otp_verifications (email, otp, expires_at, used) VALUES (?, ?, ?, ?)",
    [email.toLowerCase().trim(), otp, expiresAt, false]
  );

  return otp;
}

// Verify OTP
export async function verifyOTP(email, otp) {
  const record = await queryOne(
    "SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND used = false ORDER BY created_at DESC LIMIT 1",
    [email.toLowerCase().trim(), otp]
  );

  if (!record) {
    return false;
  }

  // Check if expired
  if (new Date() > new Date(record.expires_at)) {
    return false;
  }

  // Mark as used
  await execute(
    "UPDATE otp_verifications SET used = true WHERE id = ?",
    [record.id]
  );

  return true;
}

// Clean up expired OTPs (call periodically)
export async function cleanupExpiredOTPs() {
  await execute(
    "DELETE FROM otp_verifications WHERE expires_at < NOW() OR used = true"
  );
}


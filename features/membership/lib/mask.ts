/** Masks an email local part: "nopharat@gmail.com" -> "no******@gmail.com". */
export function maskEmail(email: string): string {
  if (!email) return "—";
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const host = email.slice(at);
  if (local.length <= 1) return `*${host}`;
  if (local.length === 2) return `${local[0]}*${host}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.min(6, local.length - 2))}${host}`;
}

/** Masks a phone number, keeping prefix and last 3 digits: "+66971166657" -> "+66******657". */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  if (phone.length <= 4) return "****";
  const head = phone.startsWith("+") && phone.length > 6 ? 3 : 2;
  const tail = 3;
  if (phone.length <= head + tail) return `${phone[0]}***`;
  return `${phone.slice(0, head)}${"*".repeat(Math.min(6, phone.length - head - tail))}${phone.slice(-tail)}`;
}

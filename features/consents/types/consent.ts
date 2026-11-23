export type ConsentType = "terms" | "pdpa" | "marketing_line" | "marketing_email";

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  terms: "ข้อกำหนดการใช้งาน",
  pdpa: "นโยบายความเป็นส่วนตัว (PDPA)",
  marketing_line: "รับข่าวสารทาง LINE",
  marketing_email: "รับข่าวสารทางอีเมล",
};

export const CONSENT_TYPES = Object.keys(CONSENT_TYPE_LABELS) as ConsentType[];

/** Marketing consents must be a free choice (PDPA), so they cannot be required. */
export function canBeRequired(type: ConsentType): boolean {
  return !type.startsWith("marketing_");
}

export interface ConsentDocument {
  id: number;
  type: ConsentType;
  version: number;
  title: string;
  content: string;
  pdfUrl: string;
  isRequired: boolean;
  effectiveAt: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentDocumentInput {
  type: ConsentType;
  title: string;
  content: string;
  pdfUrl: string;
  isRequired: boolean;
  isActive: boolean;
  effectiveAt?: string;
}

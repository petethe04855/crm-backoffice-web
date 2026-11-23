import { z } from "zod";

/** Form-side checks; backoffice-api validates again. */
export const batchFormSchema = z.object({
  erpSkuId: z.number().int().positive("กรุณาเลือกสินค้าจาก ERP"),
  skuCode: z.string().min(1, "กรุณาเลือกสินค้าจาก ERP"),
  skuName: z.string().min(1, "กรุณาเลือกสินค้าจาก ERP"),
  skuPrice: z.number().min(0),
  quantity: z.number().int("จำนวนต้องเป็นจำนวนเต็ม").min(1, "อย่างน้อย 1 รหัส").max(100000, "สูงสุด 100,000 รหัสต่อล็อต"),
  pointsPerCode: z.number().int("แต้มต้องเป็นจำนวนเต็ม").min(1, "อย่างน้อย 1 แต้ม").max(100000, "สูงสุด 100,000 แต้ม"),
  lotNumber: z.string().trim().max(100, "เลขล็อตยาวเกินไป"),
  lotExpiryDate: z.string(),
  codeExpiresAt: z.string(),
  isTest: z.boolean(),
  note: z.string().trim().max(500, "หมายเหตุยาวเกินไป"),
});

export type BatchFormValues = z.input<typeof batchFormSchema>;

export const EMPTY_BATCH_FORM: BatchFormValues = {
  erpSkuId: 0,
  skuCode: "",
  skuName: "",
  skuPrice: 0,
  quantity: 1000,
  pointsPerCode: 10,
  lotNumber: "",
  lotExpiryDate: "",
  codeExpiresAt: "",
  isTest: false,
  note: "",
};

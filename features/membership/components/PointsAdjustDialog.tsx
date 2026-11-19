"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustPoints } from "../hooks/useMemberManagement";

/** Returns a Thai error message, or null when the draft is valid. */
export function validateAdjustDraft(points: string, reason: string, balance: number): string | null {
  const value = Number(points);
  if (points.trim() === "" || !Number.isFinite(value)) return "กรอกจำนวนแต้มเป็นตัวเลข";
  if (!Number.isInteger(value)) return "แต้มต้องเป็นจำนวนเต็ม";
  if (value === 0) return "จำนวนแต้มต้องไม่เป็นศูนย์";
  if (value < 0 && balance + value < 0) return "หักแต้มเกินยอดคงเหลือ";
  if (reason.trim().length < 3) return "ระบุเหตุผลอย่างน้อย 3 ตัวอักษร";
  return null;
}

/** Manual point adjustment (owner uncapped, admin limited by policy). */
export function PointsAdjustDialog({
  memberId,
  balance,
  open,
  onClose,
}: {
  memberId: number;
  balance: number;
  open: boolean;
  onClose: () => void;
}) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const mutation = useAdjustPoints(memberId);

  const error = validateAdjustDraft(points, reason, balance);

  const close = () => {
    setPoints("");
    setReason("");
    mutation.reset();
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (error) return;
    mutation.mutate({ points: Number(points), reason: reason.trim() }, { onSuccess: close });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="ปรับแต้ม"
      description={`แต้มคงเหลือปัจจุบัน ${balance.toLocaleString("th-TH")} แต้ม · บันทึกทุกครั้งลง ledger`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="adj-points">จำนวนแต้ม (ติดลบเพื่อหัก)</Label>
          <Input
            id="adj-points"
            type="number"
            inputMode="numeric"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="เช่น 100 หรือ -50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adj-reason">เหตุผล</Label>
          <Textarea
            id="adj-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="เช่น ชดเชยแต้มจากปัญหาคูปอง / แก้ไขการกรอกรหัสผิด"
          />
          <p className="text-xs text-neutral-500">เหตุผลถูกเก็บถาวรใน ledger เพื่อการตรวจสอบย้อนหลัง</p>
        </div>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        {mutation.error instanceof Error && (
          <p role="alert" className="text-xs text-red-600">{mutation.error.message}</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={close}>ยกเลิก</Button>
          <Button type="submit" disabled={Boolean(error) || mutation.isPending}>
            {mutation.isPending ? "กำลังบันทึก…" : "บันทึก"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

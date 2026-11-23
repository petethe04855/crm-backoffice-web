"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useRedemptionTransition } from "../hooks/useRewards";
import {
  CANCELLABLE,
  NEXT_ACTION,
  REDEMPTION_STATUS_LABEL,
  STATUS_VARIANT,
  type Redemption,
} from "../types/reward";

/**
 * Status column of the redemptions queue: the badge plus the next step, so the
 * queue is worked from the status column the same way the marketing tables are.
 * A redemption has no public/unpublic state — it is a workflow, not a switch.
 */
export function RedemptionStatusCell({
  rd,
  canFulfill = true,
}: {
  rd: Redemption;
  canFulfill?: boolean;
}) {
  const transition = useRedemptionTransition();
  const [dialog, setDialog] = useState<"ship" | "cancel" | null>(null);
  const [text, setText] = useState("");
  const next = NEXT_ACTION[rd.status];

  const close = () => {
    setDialog(null);
    setText("");
    transition.reset();
  };
  const confirm = () => {
    if (dialog === "ship") {
      transition.mutate(
        { id: rd.id, action: "ship", body: { trackingNo: text.trim() } },
        { onSuccess: close },
      );
    }
    if (dialog === "cancel") {
      transition.mutate(
        { id: rd.id, action: "cancel", body: { reason: text.trim() } },
        { onSuccess: close },
      );
    }
  };
  const invalid = dialog === "ship" ? !text.trim() : text.trim().length < 3;

  if (!canFulfill) {
    return (
      <Badge variant={STATUS_VARIANT[rd.status]}>
        {REDEMPTION_STATUS_LABEL[rd.status]}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Badge variant={STATUS_VARIANT[rd.status]}>
        {REDEMPTION_STATUS_LABEL[rd.status]}
      </Badge>
      <div className="flex flex-wrap gap-1">
        {next && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={transition.isPending}
            onClick={() =>
              next.action === "ship"
                ? setDialog("ship")
                : transition.mutate({ id: rd.id, action: next.action })
            }
          >
            {next.label}
          </Button>
        )}
        {CANCELLABLE.includes(rd.status) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDialog("cancel")}
          >
            ยกเลิก
          </Button>
        )}
      </div>
      {!dialog && transition.error && (
        <span role="alert" className="max-w-[200px] whitespace-normal text-[10px] text-red-600">
          {transition.error.message}
        </span>
      )}
      <Modal
        open={dialog !== null}
        title={
          dialog === "ship"
            ? `จัดส่ง ${rd.redemptionNo}`
            : `ยกเลิก ${rd.redemptionNo}`
        }
        description={
          dialog === "ship"
            ? "ระบบจะตัดสต็อกใน ERP ก่อน ถ้าสต็อกไม่พอรายการจะค้างที่ \"กำลังแพ็ก\""
            : `คืน ${rd.points.toLocaleString("th-TH")} แต้มให้สมาชิกและคืนโควตาของรางวัล`
        }
        onClose={close}
        footer={
          <>
            <Button type="button" variant="outline" onClick={close}>
              ปิด
            </Button>
            <Button
              type="button"
              variant={dialog === "cancel" ? "destructive" : "default"}
              disabled={invalid || transition.isPending}
              onClick={confirm}
            >
              {transition.isPending
                ? "กำลังบันทึก…"
                : dialog === "ship"
                  ? "ยืนยันจัดส่ง"
                  : "ยืนยันยกเลิก"}
            </Button>
          </>
        }
      >
        <Label htmlFor={`rd-text-${rd.id}`}>
          {dialog === "ship" ? "เลขพัสดุ" : "เหตุผล (อย่างน้อย 3 ตัวอักษร)"}
        </Label>
        {dialog === "ship" ? (
          <Input
            id={`rd-text-${rd.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
          />
        ) : (
          <Textarea
            id={`rd-text-${rd.id}`}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
        {dialog === "ship" && (
          <p className="mt-3 text-xs text-neutral-600">
            ส่งถึง {rd.shipName} {rd.shipPhone} · {rd.shipAddress} {rd.shipProvince}{" "}
            {rd.shipPostcode}
          </p>
        )}
        {transition.error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {transition.error.message}
          </p>
        )}
      </Modal>
    </div>
  );
}
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { useSimulatePoints } from "../hooks/usePointRules";
import { wholeNumberError } from "../schemas/pointRuleForms";
import { EARN_RULE_TYPE_LABEL } from "../types/pointRules";
import { ThaiDateInput } from "@/components/form/ThaiDateInput";

/** Asks the backend what a member would earn. Nothing is computed here. */
export function SimulatorTab() {
  const tiers = useTiers();
  const simulate = useSimulatePoints();
  const [tierId, setTierId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [base, setBase] = useState("10");
  const [at, setAt] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = (!tierId ? "เลือกระดับสมาชิก" : null) ?? wholeNumberError(base, "แต้มต่อรหัส", 1_000_000);
    setLocalError(err);
    if (err) return;
    simulate.mutate({
      tierId: Number(tierId),
      skuId: skuId.trim(),
      basePoints: Number(base),
      at: at ? new Date(at).toISOString() : null,
    });
  };

  const result = simulate.data;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold">เครื่องคิดทดสอบ</h2>
      <p className="mb-4 text-xs text-neutral-500">ลองดูว่าสมาชิกจะได้กี่แต้มตามกติกาที่เปิดอยู่ ไม่มีการให้แต้มจริง</p>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="sim-tier">ระดับสมาชิก</Label>
          <Select id="sim-tier" value={tierId} onChange={(e) => setTierId(e.target.value)}>
            <option value="">เลือก</option>
            {(tiers.data ?? []).map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-sku">SKU (ไม่บังคับ)</Label>
          <Input id="sim-sku" value={skuId} onChange={(e) => setSkuId(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-base">แต้มต่อรหัส</Label>
          <Input id="sim-base" inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-at">วันเวลา (เว้นว่าง = ตอนนี้)</Label>
          <ThaiDateInput id="sim-at" kind="datetime" value={at} onChange={setAt} />
        </div>
        <div className="sm:col-span-4">
          <Button type="submit" disabled={simulate.isPending}>
            {simulate.isPending ? "กำลังคำนวณ…" : "คำนวณ"}
          </Button>
        </div>
      </form>

      {(localError || simulate.error) && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {localError ?? simulate.error?.message}
        </p>
      )}

      {result && !localError && (
        <div className="mt-5 rounded-lg bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">แต้มที่จะได้</p>
          <p className="text-2xl font-semibold">{result.points.toLocaleString("th-TH")}</p>
          <p className="mt-2 text-xs text-neutral-600">
            {result.rules.length === 0
              ? "ไม่มีกติกาที่เข้าเงื่อนไข — ได้เท่าแต้มต่อรหัส"
              : `กติกาที่ใช้: ${result.rules.map((r) => `#${r.id} ${EARN_RULE_TYPE_LABEL[r.type]} ×${r.multiplier}`).join(", ")}`}
          </p>
        </div>
      )}
    </section>
  );
}

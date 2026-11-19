"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { formatThaiDateTime } from "@/lib/utils";
import { useEarnRules } from "../hooks/usePointRules";
import { EARN_RULE_TRIGGER_LABEL, EARN_RULE_TYPE_LABEL, type EarnRule } from "../types/pointRules";
import { EarnRuleDialog } from "./EarnRuleDialog";

function period(r: EarnRule): string {
  if (!r.startAt && !r.endAt) return "ตลอด";
  const fmt = (v: string | null) => (v ? formatThaiDateTime(v) : "…");
  return `${fmt(r.startAt)} – ${fmt(r.endAt)}`;
}

export function EarnRulesTab({ canManage }: { canManage: boolean }) {
  const rules = useEarnRules();
  const tiers = useTiers();
  const [editing, setEditing] = useState<EarnRule | null>(null);
  const [open, setOpen] = useState(false);

  const tierName = (id: number | null) => tiers.data?.find((t) => t.id === id)?.name ?? (id ? `#${id}` : "—");
  const detail = (r: EarnRule) => {
    if (r.type === "bonus_fixed") {
      return `${r.trigger ? EARN_RULE_TRIGGER_LABEL[r.trigger] : "—"} +${r.points.toLocaleString("th-TH")} แต้ม`;
    }
    if (r.type === "tier_multiplier") return `${tierName(r.tierId)} ×${r.multiplier}`;
    const scope = r.skuIds.length ? `SKU ${r.skuIds.join(", ")}` : "ทุก SKU";
    return `×${r.multiplier} · ${scope}${r.stackable ? " · ซ้อนได้" : ""}`;
  };

  const openEditor = (rule: EarnRule | null) => {
    setEditing(rule);
    setOpen(true);
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold">กติกาการได้แต้ม</h2>
          <p className="text-xs text-neutral-500">แต้มต่อรหัสกำหนดที่ล็อตรหัสสินค้า ส่วนนี้กำหนดตัวคูณและแต้มพิเศษ</p>
        </div>
        {canManage && (
          <Button onClick={() => openEditor(null)}>
            <Plus className="mr-1 h-4 w-4" />
            เพิ่มกติกา
          </Button>
        )}
      </div>

      {rules.isLoading && <Loading message="กำลังโหลดกติกา…" />}
      {rules.isError && <ErrorState message={rules.error.message} onRetry={() => rules.refetch()} />}
      {rules.data && rules.data.length === 0 && (
        <EmptyState title="ยังไม่มีกติกา" description="ตอนนี้สมาชิกได้แต้มตามแต้มต่อรหัสของล็อตเท่านั้น" />
      )}
      {rules.data && rules.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-5 py-2 font-medium">ประเภท</th>
                <th className="px-5 py-2 font-medium">รายละเอียด</th>
                <th className="px-5 py-2 font-medium">ช่วงเวลา</th>
                <th className="px-5 py-2 font-medium">ลำดับ</th>
                <th className="px-5 py-2 font-medium">สถานะ</th>
                {canManage && <th className="px-5 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rules.data.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-2.5">{EARN_RULE_TYPE_LABEL[r.type]}</td>
                  <td className="px-5 py-2.5">{detail(r)}</td>
                  <td className="px-5 py-2.5 text-neutral-600">{period(r)}</td>
                  <td className="px-5 py-2.5">{r.priority}</td>
                  <td className="px-5 py-2.5">
                    <Badge variant={r.isActive ? "default" : "subtle"}>{r.isActive ? "เปิด" : "ปิด"}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-5 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditor(r)}>
                        แก้ไข
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <EarnRuleDialog key={editing?.id ?? "new"} rule={editing} open={open} onClose={() => setOpen(false)} />}
    </section>
  );
}

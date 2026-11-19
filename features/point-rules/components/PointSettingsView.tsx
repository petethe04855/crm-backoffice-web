"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { cn } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { EarnRulesTab } from "./EarnRulesTab";
import { AdjustPolicyTab, RedeemPolicyTab } from "./PolicyTabs";
import { SimulatorTab } from "./SimulatorTab";

type TabKey = "earn" | "redeem" | "adjust" | "simulate";

const TABS: { key: TabKey; label: string }[] = [
  { key: "earn", label: "กติกาการได้แต้ม" },
  { key: "redeem", label: "เงื่อนไขการแลก" },
  { key: "adjust", label: "เพดานปรับแต้ม" },
  { key: "simulate", label: "เครื่องคิดทดสอบ" },
];

/** /settings/points — earn rules, redeem policy, adjustment caps and calculator. */
export function PointSettingsView() {
  const session = useAuthStore((s) => s.session);
  const canManage = hasPermission(session, PERMISSIONS.settingsManage);
  const [tab, setTab] = useState<TabKey>("earn");

  return (
    <div className="space-y-6">
      <PageHeader title="ตั้งค่าแต้ม" description="กติกาการได้แต้ม เงื่อนไขการแลก และอายุแต้ม" />

      <div role="tablist" aria-label="ตั้งค่าแต้ม" className="flex gap-1 overflow-x-auto border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors",
              tab === t.key
                ? "border-neutral-900 font-medium text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "earn" && <EarnRulesTab canManage={canManage} />}
        {tab === "redeem" && <RedeemPolicyTab canManage={canManage} />}
        {tab === "adjust" && <AdjustPolicyTab canManage={canManage} />}
        {tab === "simulate" && <SimulatorTab />}
      </div>
    </div>
  );
}

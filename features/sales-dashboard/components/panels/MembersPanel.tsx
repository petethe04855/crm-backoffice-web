"use client";

import { formatNumber } from "../../lib/dashboard";
import { formatThaiDateText, formatThaiMonthText } from "@/lib/thaiDate";
import { useMemberReport } from "../../hooks/useSalesDashboard";
import type { SalesFilters } from "../../types/salesDashboard";
import { Columns, RankedBars, SegmentedBar } from "../MemberCharts";

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

/** Short axis labels for the age columns (the full label is in the tooltip). */
const AGE_AXIS: Record<string, string> = {
  under18: "<18",
  "18-24": "18–24",
  "25-34": "25–34",
  "35-44": "35–44",
  "45-54": "45–54",
  "55plus": "55+",
  unknown: "ไม่ระบุ",
};

const GENDER_LABEL: Record<string, string> = {
  male: "ชาย",
  female: "หญิง",
  other: "อื่น ๆ",
  unspecified: "ไม่ระบุ",
};

/**
 * CRM members tab (plan §6.3 part B): who signed up — how many, split by gender
 * and age, and which SKU they typed a product code for first. LINE OA members,
 * not marketplace buyers. Every number comes from the API; nothing is derived
 * here, and members with no birth date are shown as "ไม่ระบุวันเกิด" rather than
 * being folded into a band.
 */
export function MembersPanel({ filters }: { filters: SalesFilters }) {
  const report = useMemberReport(filters);

  if (report.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {(report.error as Error).message}
      </div>
    );
  }
  if (!report.data) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        กำลังโหลดข้อมูลสมาชิก…
      </div>
    );
  }
  const r = report.data;
  const genders = r.genders ?? [];
  const ages = r.ageBuckets ?? [];
  const firstRewards = r.firstRewards ?? [];
  const rewards = r.rewards ?? [];
  const genderTotal = genders.reduce((sum, g) => sum + g.members, 0);

  return (
    <div className="space-y-6">
        <div className="kpi-grid">
          <Card
            title="สมัครใหม่ในช่วงนี้"
            value={formatNumber(r.newMembers)}
            sub={`${formatThaiDateText(r.dateFrom)} – ${formatThaiDateText(r.dateTo)}`}
          />
          <Card title="สมาชิกทั้งหมด" value={formatNumber(r.totalMembers)} sub="ณ ตอนนี้" />
          <Card
            title="แลกของรางวัล"
            value={`${formatNumber(r.redemptions ?? 0)} ครั้ง`}
            sub={`จากสมาชิก ${formatNumber(r.redemptionMembers ?? 0)} คน · ไม่นับที่ยกเลิก`}
          />
          <Card title="สมาชิกที่ใช้งาน" value={formatNumber(r.activeMembers)} sub="เปิด LINE OA ในช่วงนี้" />
        </div>

        <div className="sd-members-split">
          <div className="section-card">
            <div className="section-title-wrap">
              <h3 className="chart-title">ผู้สมัครใหม่แยกตามเพศ</h3>
              <p>นับเฉพาะสมาชิกที่สมัครในช่วงที่เลือก · ไม่ระบุ = ผู้ที่ยังไม่กรอกเพศ</p>
            </div>
            {genderTotal === 0 ? (
              <p className="sd-note">ยังไม่มีผู้สมัครใหม่ในช่วงนี้</p>
            ) : (
              <SegmentedBar
                unit="คน"
                parts={genders.map((g) => ({
                  key: g.gender,
                  label: GENDER_LABEL[g.gender] ?? g.gender,
                  value: g.members,
                  share: g.sharePercent,
                  unknown: g.gender === "unspecified",
                }))}
              />
            )}
          </div>

          <div className="section-card">
            <div className="section-title-wrap">
              <h3 className="chart-title">ผู้สมัครใหม่แยกตามช่วงอายุ</h3>
              <p>คิดอายุ ณ วันนี้ · ผู้ที่ไม่กรอกวันเกิดจะแสดงแยก ไม่ถูกเดาเข้าช่วงใด</p>
            </div>
            {r.newMembers === 0 ? (
              <p className="sd-note">ยังไม่มีผู้สมัครใหม่ในช่วงนี้</p>
            ) : (
              <Columns
                columns={ages.map((a) => ({
                  key: a.key,
                  label: AGE_AXIS[a.key] ?? a.label,
                  value: a.members,
                  hint: `${a.label} · ${formatNumber(a.members)} คน · ${a.sharePercent.toFixed(1)}%`,
                  unknown: a.key === "unknown",
                }))}
              />
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ของรางวัลที่สมาชิกแลก</h3>
            <p>การแลกที่สร้างในช่วงที่เลือก เรียงจากแลกมากที่สุด · ไม่นับรายการที่ยกเลิกและคืนแต้มแล้ว</p>
          </div>
          {rewards.length === 0 ? (
            <p className="sd-note">ยังไม่มีการแลกของรางวัลในช่วงนี้</p>
          ) : (
            <>
            <RankedBars
              bars={rewards.slice(0, 10).map((rw) => ({
                key: String(rw.rewardId),
                label: rw.rewardName || "—",
                value: rw.redemptions,
                valueText: `${formatNumber(rw.redemptions)} ครั้ง`,
                hint: `${formatNumber(rw.redemptions)} ครั้ง · ${formatNumber(rw.qty)} ชิ้น · ${formatNumber(rw.points)} แต้ม`,
              }))}
            />
            <details className="mc-table-toggle">
              <summary>ดูเป็นตาราง</summary>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ของรางวัล</th>
                    <th>จำนวนครั้งที่แลก</th>
                    <th>จำนวนชิ้น</th>
                    <th>แต้มที่ใช้</th>
                    <th>สัดส่วน</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((rw) => (
                    <tr key={rw.rewardId}>
                      <td>{rw.rewardName || "—"}</td>
                      <td>{formatNumber(rw.redemptions)}</td>
                      <td>{formatNumber(rw.qty)}</td>
                      <td>{formatNumber(rw.points)}</td>
                      <td>{rw.sharePercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </details>
            </>
          )}
        </div>


        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ของรางวัลที่แรก</h3>
            <p>ของรางวัลแรกที่สมาชิกแต่ละคนแลกในช่วงที่เลือก · นับคนละ 1 ครั้ง ไม่นับรายการที่ยกเลิก</p>
          </div>
          {firstRewards.length === 0 ? (
            <p className="sd-note">ยังไม่มีการแลกของรางวัลในช่วงนี้</p>
          ) : (
            <>
              <RankedBars
                bars={firstRewards.slice(0, 10).map((fr) => ({
                  key: String(fr.rewardId),
                  label: fr.rewardName || "—",
                  value: fr.members,
                  valueText: `${formatNumber(fr.members)} คน`,
                  hint: `${fr.rewardName || "—"} · ${formatNumber(fr.members)} คน · ${fr.sharePercent.toFixed(1)}%`,
                }))}
              />
              <details className="mc-table-toggle">
                <summary>ดูเป็นตาราง</summary>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ของรางวัล</th>
                        <th>จำนวนสมาชิกที่แลกเป็นชิ้นแรก</th>
                        <th>สัดส่วน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firstRewards.map((fr) => (
                        <tr key={fr.rewardId}>
                          <td>{fr.rewardName || "—"}</td>
                          <td>{formatNumber(fr.members)}</td>
                          <td>{fr.sharePercent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </div>

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ผู้สมัครใหม่รายเดือน</h3>
            <p>ตัดเดือนตามเวลาไทย</p>
          </div>
          <Columns
            height={160}
            columns={r.months.map((m) => ({
              key: m.month,
              label: formatThaiMonthText(m.month, true),
              value: m.newMembers,
              hint: `${formatNumber(m.newMembers)} คน`,
            }))}
          />
          <div style={{ marginTop: 16 }} />
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th>สมาชิกใหม่</th>
                  <th>แต้มที่ให้</th>
                  <th>แต้มที่แลก</th>
                  <th>แต้มหมดอายุ</th>
                </tr>
              </thead>
              <tbody>
                {r.months.map((m) => (
                  <tr key={m.month}>
                    <td>{formatThaiMonthText(m.month)}</td>
                    <td>{formatNumber(m.newMembers)}</td>
                    <td>{formatNumber(m.pointsEarned)}</td>
                    <td>{formatNumber(m.pointsRedeemed)}</td>
                    <td>{formatNumber(m.pointsExpired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
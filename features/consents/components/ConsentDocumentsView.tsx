"use client";

import { useState, type FormEvent } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { SearchPanel } from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDateTime } from "@/lib/utils";
import { useConsentDocuments, useCreateConsentDocument, useSetConsentActive } from "../hooks/useConsents";
import { CONSENT_TYPES, CONSENT_TYPE_LABELS, canBeRequired, type ConsentType } from "../types/consent";

const emptyForm = {
  type: "terms" as ConsentType,
  title: "",
  content: "",
  pdfUrl: "",
  isRequired: true,
  isActive: true,
};

/**
 * PDPA consent documents shown in the LINE OA before registration. Each save
 * publishes a new version; members must accept a new required version again.
 * The content is shown to members as plain text.
 */
export function ConsentDocumentsView() {
  const docs = useConsentDocuments();
  const create = useCreateConsentDocument();
  const setActive = useSetConsentActive();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const changeType = (type: ConsentType) =>
    setForm((f) => ({ ...f, type, isRequired: canBeRequired(type) ? f.isRequired : false }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("กรุณากรอกชื่อเอกสารและเนื้อหา");
      return;
    }
    if (form.pdfUrl.trim() && !form.pdfUrl.trim().startsWith("https://")) {
      setFormError("ลิงก์ PDF ต้องขึ้นต้นด้วย https://");
      return;
    }
    create.mutate(
      { ...form, title: form.title.trim(), content: form.content.trim(), pdfUrl: form.pdfUrl.trim() },
      { onSuccess: () => setForm({ ...emptyForm, type: form.type }) },
    );
  };

  const error = formError ?? (create.error instanceof Error ? create.error.message : null);

  return (
    <>
      <PageHeader
        title="เอกสารความยินยอม"
        description="ข้อกำหนดและความยินยอม PDPA ที่สมาชิกต้องยอมรับใน LINE OA — บันทึกแต่ละครั้งเป็นเวอร์ชันใหม่ ถ้าเอกสารบังคับมีเวอร์ชันใหม่ สมาชิกต้องกดยอมรับอีกครั้ง"
      />
      <TwoColumnLayout
        sidebar={
          <SearchPanel title="เผยแพร่เวอร์ชันใหม่">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cd-type">ประเภท</Label>
                <Select id="cd-type" value={form.type} onChange={(e) => changeType(e.target.value as ConsentType)}>
                  {CONSENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {CONSENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-title">ชื่อเอกสาร</Label>
                <Input id="cd-title" maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-content">เนื้อหา</Label>
                <Textarea
                  id="cd-content"
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                <p className="text-xs text-neutral-500">แสดงเป็นข้อความธรรมดา เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cd-pdf">ลิงก์ PDF (ถ้ามี)</Label>
                <Input id="cd-pdf" type="url" placeholder="https://" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.isRequired}
                  disabled={!canBeRequired(form.type)}
                  onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                />
                <span>
                  บังคับยอมรับ
                  {!canBeRequired(form.type) && (
                    <span className="block text-xs text-neutral-500">ความยินยอมรับข่าวสารต้องให้สมาชิกเลือกเอง</span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                เปิดใช้ทันที
              </label>
              {error && (
                <p role="alert" className="text-xs text-red-600">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "กำลังบันทึก…" : "เผยแพร่"}
              </Button>
            </form>
          </SearchPanel>
        }
        content={
          docs.isLoading ? (
            <Loading />
          ) : docs.isError ? (
            <ErrorState message={docs.error.message} onRetry={() => docs.refetch()} />
          ) : (
            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-600">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap text-left">ประเภท</th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">เวอร์ชัน</th>
                    <th className="px-5 py-3 text-left">ชื่อเอกสาร</th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">สถานะ</th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">มีผลตั้งแต่</th>
                    <th className="px-5 py-3 whitespace-nowrap text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(docs.data ?? []).map((d) => (
                    <tr key={d.id}>
                      <td className="px-5 py-3 whitespace-nowrap">{CONSENT_TYPE_LABELS[d.type] ?? d.type}</td>
                      <td className="px-5 py-3 whitespace-nowrap font-mono">v{d.version}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium">{d.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{d.content}</p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap space-x-1">
                        <Badge variant={d.isActive ? "default" : "subtle"}>{d.isActive ? "เปิดใช้" : "ปิด"}</Badge>
                        {d.isRequired && <Badge variant="outline">บังคับ</Badge>}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{formatThaiDateTime(d.effectiveAt)}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={setActive.isPending}
                          onClick={() => setActive.mutate({ id: d.id, isActive: !d.isActive })}
                        >
                          {d.isActive ? "ปิดใช้" : "เปิดใช้"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {docs.data?.length === 0 && (
                <p className="py-12 text-center text-sm text-neutral-500">
                  ยังไม่มีเอกสาร — สมาชิกใหม่จะข้ามขั้นตอนยอมรับข้อตกลงจนกว่าจะเผยแพร่เอกสารบังคับ
                </p>
              )}
            </section>
          )
        }
      />
    </>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiDateTime } from "@/lib/utils";
import { useAddNote, useAddTag, useMemberNotes, useRemoveTag } from "../hooks/useMemberManagement";
import type { MemberTag } from "../types/member";

function TagEditor({
  memberId,
  tags,
  canManage,
}: {
  memberId: number;
  tags: MemberTag[];
  canManage: boolean;
}) {
  const [draft, setDraft] = useState("");
  const addTag = useAddTag(memberId);
  const removeTag = useRemoveTag(memberId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    addTag.mutate(value, { onSuccess: () => setDraft("") });
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold mb-3">แท็ก</h2>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-sm text-neutral-500">ยังไม่มีแท็ก</p>}
        {tags.map((t) => (
          <Badge key={t.tag} variant="secondary" className="gap-1 pr-1">
            {t.tag}
            {canManage && (
              <button
                type="button"
                aria-label={`ลบแท็ก ${t.tag}`}
                className="rounded-full p-0.5 hover:bg-black/10"
                onClick={() => removeTag.mutate(t.tag)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {canManage && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <Input
            aria-label="เพิ่มแท็ก"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={40}
            placeholder="เช่น vip, ร้องเรียน"
          />
          <Button type="submit" variant="outline" disabled={!draft.trim() || addTag.isPending}>
            เพิ่ม
          </Button>
        </form>
      )}
      {(addTag.error instanceof Error || removeTag.error instanceof Error) && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {(addTag.error as Error | null)?.message ?? (removeTag.error as Error | null)?.message}
        </p>
      )}
    </section>
  );
}

/** Internal notes and tags. Never visible to the customer. */
export function MemberNotesTab({
  memberId,
  tags,
  canManageTags,
  canAddNotes,
}: {
  memberId: number;
  tags: MemberTag[];
  canManageTags: boolean;
  canAddNotes: boolean;
}) {
  const [page, setPage] = useState(1);
  const [body, setBody] = useState("");
  const notes = useMemberNotes(memberId, page);
  const addNote = useAddNote(memberId);
  const total = notes.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (notes.data?.meta.limit ?? 20)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = body.trim();
    if (value.length === 0) return;
    addNote.mutate(value, { onSuccess: () => setBody("") });
  };

  return (
    <div className="space-y-4">
      <TagEditor memberId={memberId} tags={tags} canManage={canManageTags} />

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">โน้ตหลังบ้าน</h2>
        {canAddNotes ? (
          <form onSubmit={submit} className="space-y-2">
            <Label htmlFor="note-body" className="sr-only">โน้ต</Label>
            <Textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              placeholder="บันทึกสิ่งที่ทีมควรรู้ เช่น ลูกค้าโทรมาถามแต้ม, ร้องเรียนการจัดส่ง"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{body.length}/2000</span>
              <Button type="submit" disabled={!body.trim() || addNote.isPending}>
                {addNote.isPending ? "กำลังบันทึก…" : "เพิ่มโน้ต"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-neutral-500">บัญชีของคุณไม่มีสิทธิ์เพิ่มโน้ต</p>
        )}
        {addNote.error instanceof Error && (
          <p role="alert" className="mt-2 text-xs text-red-600">{addNote.error.message}</p>
        )}

        <ul className="mt-4 divide-y divide-neutral-100">
          {notes.isLoading && <li className="py-4 text-sm text-neutral-500">กำลังโหลด…</li>}
          {!notes.isLoading && (notes.data?.data.length ?? 0) === 0 && (
            <li className="py-4 text-sm text-neutral-500">ยังไม่มีโน้ต</li>
          )}
          {notes.data?.data.map((n) => (
            <li key={n.id} className="py-3">
              <p className="text-sm text-neutral-900 whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {n.createdByEmail || `ผู้ใช้ #${n.createdBy}`} · {formatThaiDateTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ก่อนหน้า
            </Button>
            <span className="text-xs text-neutral-500">หน้า {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              ถัดไป
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

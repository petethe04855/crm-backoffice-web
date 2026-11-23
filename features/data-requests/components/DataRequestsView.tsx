"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatThaiDateTime } from "@/lib/utils";
import { dataRequestsApi, type DataRequest, type DataRequestStatus } from "../api/dataRequestsApi";

const STATUS_LABEL: Record<DataRequestStatus, string> = { pending: "รอดำเนินการ", completed: "ลบแล้ว", rejected: "ปฏิเสธ" };
const STATUS_VARIANT: Record<DataRequestStatus, "default" | "subtle" | "destructive"> = {
  pending: "default",
  completed: "subtle",
  rejected: "destructive",
};

/** PDPA account deletion requests from the LINE OA (oldest first). */
export function DataRequestsView() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<DataRequestStatus | "">("pending");
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["data-requests", status, page],
    queryFn: () => dataRequestsApi.list(status, page),
    placeholderData: keepPreviousData,
  });
  const done = () => qc.invalidateQueries({ queryKey: ["data-requests"] });
  const complete = useMutation({ mutationFn: (r: { id: number; note: string }) => dataRequestsApi.complete(r.id, r.note), onSuccess: done });
  const reject = useMutation({ mutationFn: (r: { id: number; note: string }) => dataRequestsApi.reject(r.id, r.note), onSuccess: done });
  const error = complete.error ?? reject.error;

  const onComplete = (r: DataRequest) => {
    if (!window.confirm(`ลบข้อมูลส่วนตัวของ ${r.memberCode} (${r.name})?\n\nชื่อ อีเมล เบอร์ วันเกิด ที่อยู่ และการผูก LINE จะถูกลบถาวร คูปองที่ยังไม่ใช้ถูกยกเลิก ประวัติแต้มเก็บไว้แบบไม่ระบุตัวตน — ย้อนกลับไม่ได้`)) return;
    complete.mutate({ id: r.id, note: "" });
  };
  const onReject = (r: DataRequest) => {
    const note = window.prompt(`เหตุผลที่ปฏิเสธคำขอของ ${r.memberCode} (บันทึกไว้ในคำขอ — แจ้งสมาชิกเองหากจำเป็น)`);
    if (note && note.trim()) reject.mutate({ id: r.id, note: note.trim() });
  };

  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.meta.total / list.data.meta.limit)) : 1;

  return (
    <>
      <PageHeader
        title="คำขอลบบัญชี (PDPA)"
        description="สมาชิกขอลบบัญชีจาก LINE OA — ถ้ายังมีรายการแลกรางวัลที่ยังไม่จัดส่ง ต้องจัดส่งหรือยกเลิกก่อนจึงลบได้"
      />
      <div className="mb-4 flex items-center gap-2">
        <Select aria-label="สถานะ" className="w-48" value={status} onChange={(e) => { setStatus(e.target.value as DataRequestStatus | ""); setPage(1); }}>
          <option value="pending">รอดำเนินการ</option>
          <option value="completed">ลบแล้ว</option>
          <option value="rejected">ปฏิเสธ</option>
          <option value="">ทั้งหมด</option>
        </Select>
      </div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}
      {list.isLoading ? (
        <Loading />
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
      ) : (
        <section className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
              <tr>
                <th className="px-4 py-3 text-left">สมาชิก</th>
                <th className="px-4 py-3 text-left">เหตุผล</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">ส่งคำขอเมื่อ</th>
                <th className="px-4 py-3 text-left">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(list.data?.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <Link href={`/members/${r.memberId}`} className="font-mono hover:underline">
                      {r.memberCode}
                    </Link>
                    <p className="text-xs text-neutral-500">{r.status === "completed" ? "—" : `${r.name} · ${r.email}`}</p>
                  </td>
                  <td className="px-4 py-3">{r.reason || <span className="text-neutral-400">—</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatThaiDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    {r.staffNote && <p className="mt-1 text-xs text-neutral-500">{r.staffNote}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="destructive" disabled={complete.isPending} onClick={() => onComplete(r)}>
                          ลบข้อมูล
                        </Button>
                        <Button size="sm" variant="ghost" disabled={reject.isPending} onClick={() => onReject(r)}>
                          ปฏิเสธ
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.data?.data.length === 0 && <p className="py-12 text-center text-sm text-neutral-500">ไม่มีคำขอ</p>}
        </section>
      )}
      {list.data && totalPages > 1 && (
        <div className="mt-3">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={list.data.meta.total} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { useCreateBatch } from "../hooks/useProductCodes";
import { EMPTY_BATCH_FORM } from "../schemas/batchForm";
import { BatchForm } from "./BatchForm";

/** Dedicated page view for creating a new product-code batch (draft). */
export function CreateBatchView() {
  const router = useRouter();
  const create = useCreateBatch();

  return (
    <>
      <PageHeader
        title="สร้างล็อตรหัสใหม่"
        description="กำหนดสินค้า จำนวนรหัส แต้มต่อรหัส และเลขล็อตสินค้า เพื่อสร้างเป็นร่างก่อนส่งออกไฟล์พิมพ์"
        actions={
          <Link
            href="/product-codes"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            กลับไปล็อตรหัส
          </Link>
        }
      />

      <section className="max-w-3xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <BatchForm
          initialValues={EMPTY_BATCH_FORM}
          submitLabel="สร้างล็อต (ร่าง)"
          isPending={create.isPending}
          serverError={create.error?.message}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: () => router.push("/product-codes"),
            })
          }
        />
      </section>
    </>
  );
}

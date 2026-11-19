import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-[10px] tracking-[0.24em] uppercase text-neutral-500 mb-2">Chawy · CRM backoffice</p>
        <h1 className="text-2xl font-semibold mb-6">เข้าสู่ระบบ</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";
import { lineSeedSansTH } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chawy CRM · Backoffice",
  description: "ระบบหลังบ้านสมาชิก LINE OA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={lineSeedSansTH.variable}>
      <body className={lineSeedSansTH.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

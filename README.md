# backoffice-web

หน้าจอหลังบ้าน CRM (Next.js App Router + TypeScript + TanStack Query + Tailwind) — convention เดียวกับ `erp-web-v2`
แผน: [`plan/CRM_BACKOFFICE.md`](../plan/CRM_BACKOFFICE.md)

- Login ด้วยบัญชี ERP (`erp-api-v2` `/auth/login`) → ขอสิทธิ์ CRM จาก `backoffice-api` `/crm/me`
- เมนูและหน้าแสดงตามสิทธิ์ที่ได้ (API ตรวจซ้ำทุกครั้ง)

## รัน

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:8092
```

ต้องรัน `backoffice-api` (8090) และ `erp-api-v2` (8084) ด้วย

## ตรวจ

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## หน้าที่มี

| หน้า | สิทธิ์ |
|---|---|
| `/login` | — |
| `/members` รายชื่อ + ตัวกรอง + ส่งออก Excel | `members.view` (ส่งออก: `members.export`) |
| `/members/[id]` รายละเอียดสมาชิก | `members.view` |
| `/promotions` ตารางโปรโมชั่น + ตัวกรองเดือน/สถานะ/ตำแหน่ง | `promotions.view` |
| `/promotions/calendar` ปฏิทินรายเดือน (แถบช่วงวัน) | `promotions.view` |
| `/promotions/new`, `/promotions/[id]` ฟอร์ม + ตัวอย่างการ์ด LINE | `promotions.manage` (ดูอย่างเดียว: `promotions.view`) |
| `/settings/staff-roles` กำหนด role `admin` ของ CRM | `staff_roles.manage` (owner) |

## โครงสร้าง

```text
app/(auth)/login, app/(admin)/...   page.tsx บาง ๆ ประกอบ component
features/auth/                      login, SessionGuard, RequirePermission
features/membership/                api, hooks, components, types ของสมาชิก
features/promotions/                api, hooks, components, types, schemas, lib (ปฏิทิน) ของโปรโมชั่น
features/staff-roles/               role admin ของ CRM
components/                         ui, layout, common (ยกแบบจาก erp-web-v2)
lib/axios.ts                        crmClient (backoffice-api), erpAuthClient (login เท่านั้น)
```

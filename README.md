# Siam Elite Consulting — Website · v1.2.0

เว็บไซต์ **3 ภาษาในตัวเดียว** (ไทย เริ่มต้น · English · 中文 — สลับในหน้าเดียวกันหมดทุกหน้า)
สำหรับ Siam Elite Consulting (วีซ่า · อสังหาริมทรัพย์ · จัดหาแม่บ้าน ในเชียงใหม่)

ดีไซน์ **premium minimal** โทน navy + ทอง — type scale เดียวทั้งเว็บ, ฟอนต์ IBM Plex Sans Thai /
Inter / Noto Sans SC, ไอคอนเส้นสะอาด, hero split ภาพจริง

> ประวัติการเปลี่ยนแปลง: [CHANGELOG.md](CHANGELOG.md) · เวอร์ชัน: [VERSION](VERSION)

## รันดูในเครื่อง
เป็น **static site** (ไม่มี build step) แต่ property listings โหลดผ่าน `fetch()` จาก JSON — ต้องรัน
ผ่านเว็บเซิร์ฟเวอร์เล็กๆ (มีให้แล้ว): `node .claude/server.js` แล้วเปิด `http://localhost:4612`
หรือใช้ `npx serve` / VS Code Live Server ก็ได้

## โครงสร้างไฟล์
```
index.html          หน้าแรก (hero, ทรัพย์เด่น 6 รายการ, วีซ่า, ขั้นตอน, about, FAQ, ฟอร์ม)
properties.html     อสังหาฯ ทั้งหมด — filter (สถานะ/ชนิด/ทำเล/ห้องนอน/งบ) + ค้นหา + เรียงราคา
property.html       รายละเอียดทรัพย์รายตัว (?ref=CODE) — แกลเลอรี, สเปก, การถือครองต่างชาติ, ทรัพย์คล้าย
privacy.html · terms.html   หน้ากฎหมาย (PDPA)
404.html            หน้า 404 แบรนด์
assets/css/styles.css   ธีม/ดีไซน์ทั้งหมด (ปรับสี/สเกลที่ตัวแปร :root ด้านบนไฟล์)
assets/js/app.js        ภาษา 3 ภาษา / เมนู / ฟอร์มทีละขั้น / โหลด+กรอง+เรียงทรัพย์ / รายละเอียด / FAQ
assets/data/properties.json   ข้อมูลทรัพย์ทั้งหมด 45 รายการ (แก้ไฟล์นี้โดยตรง)
assets/img/properties/        รูปภาพทรัพย์
vercel.json         redirect + security headers + cache รูป
sitemap.xml · robots.txt
supabase/schema.sql     DDL ตาราง leads
```

## แก้ไข/เพิ่มรายการทรัพย์
ข้อมูลอยู่ไฟล์เดียว **`assets/data/properties.json`** (45 รายการ: 28 บ้าน + 17 คอนโด ทั้งหมดเช่า)
แก้แล้ว `git add -A && git commit && git push` → Vercel deploy อัตโนมัติ

ฟิลด์ต่อรายการ: `code` (รหัสไม่ซ้ำ) · `featured` (โชว์หน้าแรก) · `status` (rent/sale) ·
`type` (house/condo/villa) · `location` (โซนกรอง) + `location_th/en/zh` · `title_th/en/zh` ·
`desc_th/en/zh` · `beds` `baths` `sqm` `land_sqm` `parking` `floor` `furnished` `ownership` ·
`price_th/en` · `tier` (a/b/c งบ) · `image` `gallery` · `features` (th/en/zh)

- เพิ่มรูป: วางใน `assets/img/properties/` แล้วอ้าง path ใน `image`/`gallery` (แนะนำย่อ ≤1100px)
- Supabase มีสำเนาตาราง `properties` ไว้ต่อยอด (เว็บอ่านจาก JSON เป็นหลัก)
- สคริปต์นำเข้าจาก .docx: `assets/tools/import_houses.py` / `import_condos.py` (ปรับ `SRC` แล้วรัน)

## ระบบ 3 ภาษา
ทุกข้อความห่อด้วย `<span class="lang-th|lang-en|lang-zh">` · `setLang()` ใน `app.js` สลับด้วย
class บน `<body>` (en/zh) · แต่ละหน้าประกาศภาษาที่รองรับด้วย `<body data-langs="th,en,zh">`
เนื้อหาจีนของ chrome สร้างอัตโนมัติจาก dictionary `ZH` ใน `app.js` (ไม่มีในดิกก็ fallback อังกฤษ
จึงไม่มีทางว่างเปล่า) · ข้อมูลทรัพย์แปลจีนในไฟล์ JSON

## Stack
- **GitHub** [github.com/ratthakans/siamelite](https://github.com/ratthakans/siamelite)
- **Vercel** [siamelite.vercel.app](https://siamelite.vercel.app) — push `main` = deploy อัตโนมัติ
- **Supabase** — เก็บ lead จากฟอร์ม (ตาราง `leads`, insert-only RLS) + สำเนาทรัพย์

## ฟอร์มติดต่อ → Supabase + อีเมล
เมื่อลูกค้ากด submit: (1) บันทึกเข้า Supabase `leads` · (2) **ส่งอีเมลแจ้งเตือนเข้า Gmail** ผ่าน
Web3Forms · (3) ขึ้นหน้าขอบคุณ + ปุ่ม LINE/WhatsApp
- ดู lead: Supabase dashboard → Table Editor → `leads`
- คีย์/คอนฟิกอยู่บนสุดของ `app.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `EMAIL_NOTIFY_KEY`
- กันสแปมด้วย honeypot · PDPA: checkbox ยินยอม (บังคับติ๊ก) + privacy/terms

## จุดที่ตั้งค่าได้ (config อยู่บนสุดของ app.js)
- `EMAIL_NOTIFY_KEY` — Web3Forms key (อีเมลแจ้ง lead เข้า siameliteconsulting@gmail.com)
- `GA4_ID` / `META_PIXEL_ID` — ยังเป็น placeholder "G-XXX" → ใส่ ID จริงเพื่อเปิด analytics
  (ยิง event `generate_lead` / Meta `Lead` อัตโนมัติเมื่อเปิดใช้)
- ช่องทางติดต่อ (LINE OA `lin.ee/...`, WhatsApp, WeChat, โทร) กระจายอยู่ใน HTML + `app.js`

## SEO & แชร์ลิงก์ (ทำไว้แล้ว)
OG image + meta ครบ · canonical/OG ต่อหน้า + ต่อทรัพย์ (dynamic) · Schema.org
RealEstateAgent + House/Apartment · sitemap 49 URL · robots.txt · theme-color · apple-touch-icon

## เหลือรอข้อมูลจริงจากลูกค้า (ไม่บล็อกการใช้งาน)
1. **โลโก้มังกรจริง** — ตอนนี้ใช้ตราประทับ SE ทอง (`assets/img/logo-gold.svg`) ที่ออกแบบให้เข้าธีม
2. **รีวิว + ทีมงานจริง** — 2 section (`#team`, testimonials) สร้างไว้แต่ซ่อน (`hidden`) รอรูป/ชื่อจริง
3. **GA4 / Meta Pixel ID** — ถ้าจะยิงแอด/วัดผล
4. **โดเมนของตัวเอง** — Vercel → Settings → Domains (รองรับ HTTPS อัตโนมัติ)

## ธีมสี
ปรับที่ตัวแปร `:root` ด้านบน `assets/css/styles.css` — navy `--navy-*`, ทอง `--gold-*`,
type scale `--fs-*`. ค่าเริ่มต้นภาษาไทย

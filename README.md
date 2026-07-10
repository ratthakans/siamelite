# Siam Elite Consulting — Website · v1.0.0

เว็บไซต์ **3 ภาษา** (ไทย เป็นค่าเริ่มต้น · อังกฤษ สลับในหน้า · จีน หน้า `zh.html`) สำหรับ Siam Elite Consulting
ดีไซน์ **premium minimal** โทนกรมท่า + ทอง — type scale เดียวทั้งเว็บ, ฟอนต์ IBM Plex Sans Thai / Noto Sans SC,
ไอคอนเส้นสะอาด, hero เป็น split ภาพจริง

> ประวัติการเปลี่ยนแปลง: [CHANGELOG.md](CHANGELOG.md) · เวอร์ชันปัจจุบัน: [VERSION](VERSION) = 1.0.0

## เปิดดูเว็บ
เว็บนี้เป็น **static site** (ไม่มี build step) แต่ตอนนี้ property listings โหลดจากไฟล์ JSON ผ่าน
`fetch()` ซึ่งเบราว์เซอร์ส่วนใหญ่บล็อก fetch จากไฟล์ `file://` ตรงๆ — ต้องรันผ่านเว็บเซิร์ฟเวอร์
เล็กๆ (ในเครื่องนี้มี `.claude/server.js` ให้แล้ว: `node .claude/server.js`) หรือใช้
`npx serve` / VS Code Live Server ก็ได้

## โครงสร้างไฟล์
```
index.html                    หน้าแรก (hero, ทรัพย์เด่น, วีซ่า, about, FAQ, ฟอร์ม, footer)
properties.html               หน้าอสังหาริมทรัพย์ทั้งหมด (filter เต็มรูปแบบ + ฟอร์มส่งความสนใจ)
property.html                 หน้ารายละเอียดทรัพย์รายตัว (?ref=CODE) — แกลเลอรี, สเปกครบ,
                              คำแนะนำการถือครองสำหรับต่างชาติ, ทรัพย์ใกล้เคียง, ฟอร์มสนใจ
assets/css/styles.css         ธีม/ดีไซน์ทั้งหมด (ปรับสีที่ตัวแปร :root ด้านบนไฟล์)
assets/js/app.js              ภาษา / เมนู / ฟอร์มทีละขั้น / โหลด+กรองอสังหาฯ / หน้ารายละเอียด / FAQ
assets/data/properties.json   ข้อมูลทรัพย์ทั้งหมด (แก้ไฟล์นี้โดยตรง — ดูด้านล่าง)
assets/img/properties/        รูปภาพทรัพย์
```

> การ์ดทรัพย์แต่ละใบคลิกเข้าหน้ารายละเอียด (`property.html?ref=รหัส`) ได้ ข้อมูลทั้งหมด —
> รายละเอียด, ที่ดิน, ที่จอดรถ, ชั้น (คอนโด), เฟอร์นิเจอร์, **การถือครองสำหรับต่างชาติ**,
> จุดเด่น และอัลบั้มรูป — แก้ได้ครบในไฟล์ `assets/data/properties.json`

## 🌐 Stack ที่ใช้จริงตอนนี้
- **GitHub**: [github.com/ratthakans/siamelite](https://github.com/ratthakans/siamelite) — เก็บโค้ดทั้งหมด
- **Vercel**: [siamelite.vercel.app](https://siamelite.vercel.app) — โฮสต์เว็บ เชื่อมกับ GitHub แล้ว
  **push ขึ้น `main` เมื่อไหร่ เว็บ deploy ใหม่ให้อัตโนมัติทันที** (ทดสอบแล้วว่าทำงานจริง)
- **Supabase** — เก็บข้อมูล lead จากฟอร์มติดต่อ + สำเนาข้อมูลทรัพย์ (ตาราง `properties`)

> หมายเหตุ: **ระบบ CMS (`/admin`) ถูกถอดออกชั่วคราวแล้ว** ตามที่ร้องขอ — แก้ไขรายการทรัพย์
> โดยแก้ไฟล์ `assets/data/properties.json` โดยตรง (ดูหัวข้อถัดไป) ถ้าต้องการ CMS กลับมา
> บอกได้ ผมกู้คืนจาก git history ได้ทันที

## ✏️ แก้ไขรายการทรัพย์ (ตอนนี้ไม่มี CMS)
ข้อมูลทรัพย์ทั้งหมดอยู่ในไฟล์เดียว: **`assets/data/properties.json`** — แก้ตรงนี้แล้ว
`git add . && git commit && git push` เว็บจะ deploy ใหม่อัตโนมัติ

แต่ละรายการมีฟิลด์: `code` (รหัสไม่ซ้ำ ใช้ในลิงก์หน้ารายละเอียด), `featured` (โชว์หน้าแรก),
`status` (rent/sale), `type` (house/condo/villa), `location` (โซนสำหรับกรอง) + `location_th/en`,
`title_th/en`, `desc_th/en`, `beds`, `baths`, `sqm`, `land_sqm`, `parking`, `floor`, `furnished`,
`ownership`, `price_th/en`, `tier` (a/b/c งบประมาณ), `image` (รูปปก), `gallery` (อัลบั้มรูป),
`features` (จุดเด่น ไทย/อังกฤษ)

**เพิ่มรูป**: วางไฟล์ใน `assets/img/properties/` แล้วอ้างอิง path ใน `image` / `gallery`

**สคริปต์นำเข้าจากโฟลเดอร์ .docx**: `assets/tools/import_houses.py` (ดึงข้อมูลบ้านจากโฟลเดอร์
ที่มีไฟล์ .docx + รูป — ปรับ `SRC` ในไฟล์ให้ชี้โฟลเดอร์ต้นทาง แล้วรัน `python3`)

## 🗄️ ข้อมูลทรัพย์ใน Supabase (ตาราง `properties`)
ข้อมูลทรัพย์ทั้ง 28 หลังถูกเก็บสำเนาไว้ในตาราง `properties` บน Supabase ด้วย (public-read)
ดู/แก้ได้ที่ Supabase dashboard → Table Editor → `properties` schema อยู่ในโค้ดที่
`supabase/schema.sql` เว็บตอนนี้ยังอ่านทรัพย์จาก `properties.json` เป็นหลัก (Supabase เป็นสำเนา/
พร้อมใช้ต่อยอด เช่น dashboard หรือแอปอื่น)

## 🎨 ธีมสี
ยึดสัดส่วน **ขาว 60% · navy 30% · ทอง 10%** ปรับสีได้ที่ตัวแปร `:root` ด้านบนของ
`assets/css/styles.css` ค่าเริ่มต้นเป็น **ภาษาไทย** (ผู้เข้าชมกดสลับ EN ได้ที่มุมขวาบน)

## ✅ ข้อมูลอสังหาฯ เป็นบ้านจริงแล้ว (28 หลัง)
นำเข้าจากข้อมูลเจ้าของจริง (โฟลเดอร์ .docx + รูปถ่ายจริง) ทั้งหมดเป็นบ้านให้เช่าในเชียงใหม่
ราคา ฿12,000–35,000/เดือน — ตัดข้อมูลติดต่อเจ้าของออกแล้วเพื่อความเป็นส่วนตัว
(เว็บแสดงเฉพาะช่องทางของ Siam Elite) แก้ไข/เพิ่มได้ในไฟล์ `assets/data/properties.json`

## ✅ สิ่งที่ต้องแก้ให้เป็นข้อมูลจริง (ไล่ทีละจุด)
1. **โลโก้จริง** — ตอนนี้ใช้โลโก้ SVG ตัวยืน 2 ไฟล์:
   - `assets/img/logo.svg` — สี navy+ทอง พื้นใส
   - `assets/img/logo-gold.svg` — สีทอง พื้นใส (ใช้ทั้ง header และ footer ตอนนี้)
   เอาไฟล์โลโก้มังกรจริงของคุณ (แนะนำเป็น **PNG พื้นหลังใส**) มาวางแล้วแก้ path ใน `index.html`
   และ `properties.html` — หรือทับไฟล์ `.svg` เหล่านี้ได้เลย มีสคริปต์ช่วยทำสี/ลบพื้นหลัง
   อัตโนมัติที่ `assets/tools/make_logo.py`
2. **รีวิวลูกค้า** — เปลี่ยนข้อความ testimonial เป็นรีวิวจริง (ยิ่งมีรูปคู่ทีมงานยิ่งดี)
3. **ทีมงาน (Team section ใหม่)** — ใน `index.html` ส่วน `id="team"` มีการ์ด 3 ใบเป็น placeholder
   ("ใส่ชื่อจริง") ใส่ชื่อ-รูปถ่ายทีมจริง เพิ่มความน่าเชื่อถือมาก (แทน `SE` ใน `.team-av` ด้วย
   `<img src="...">`)
4. **Analytics** — ใน `assets/js/app.js` ด้านบนมี `GA4_ID` และ `META_PIXEL_ID` เป็น placeholder
   ("G-XXX...") ใส่ ID จริงเพื่อเปิดการวัดผล (ยังไม่โหลด/ไม่ติดตามจนกว่าจะใส่ค่าจริง)
   — form submit ยิง event `generate_lead` / Meta `Lead` ให้อัตโนมัติเมื่อเปิดใช้

## 🖼️ SEO & แชร์ลิงก์ (ทำไว้ให้แล้ว)
- **OG image** (`assets/img/og-cover.jpg`) + meta tags — แชร์ลิงก์ใน Line/Facebook ขึ้นรูป preview
  สวยงามแล้ว (สร้างใหม่ได้ด้วย `python3 assets/tools/make_og.py`)
- **Schema.org** — หน้าแรกฝัง `RealEstateAgent`, หน้ารายละเอียดทรัพย์ฝัง `House`/`Apartment`
  อัตโนมัติ → ช่วยให้ Google เข้าใจและขึ้นผลค้นหาแบบ rich
- **PDPA** — ฟอร์มมี checkbox ยินยอม (บังคับติ๊กก่อนส่ง) + หน้า `privacy.html` และ `terms.html`
  พร้อมใช้ ลิงก์อยู่ท้าย footer ทุกหน้า

> ⚠️ มี **lead ทดสอบ 2 รายการ** ในตาราง Supabase (`ทดสอบระบบ CMS`, `Consent Test`, `ทดสอบระบบ`) จากการเทสต์
> ลบได้ที่ Supabase dashboard → Table Editor → leads

## 🔎 ระบบ filter อสังหาฯ ทำงานอย่างไร
`assets/js/app.js` จะ `fetch()` ข้อมูลจาก `assets/data/properties.json` มาสร้างการ์ดใส่ใน
`#propGrid` แล้วค่อยผูกระบบกรอง (`initPropertyFilters`) หน้าแรก (`index.html`) แสดงเฉพาะรายการ
ที่ติ๊ก `featured: true` ส่วนหน้า `properties.html` แสดงทุกรายการ — filter ทำงาน real-time
ไม่ต้องกด "ค้นหา" เพิ่ม/ลบทรัพย์ทำได้โดยแก้ไฟล์ `assets/data/properties.json` โดยตรง

> หมายเหตุ: บริการ **แลกเงิน (Currency Exchange) ถูกถอดออกชั่วคราว** (รอใบอนุญาต) — เว็บตอนนี้เน้น
> วีซ่า + อสังหาฯ/แม่บ้าน โค้ด CSS ของ section แลกเงินยังเก็บไว้ในไฟล์ พร้อมเปิดกลับเมื่อพร้อม

## 🔗 ฟอร์มติดต่อ → Supabase (เชื่อมแล้ว ✅)
ฟอร์มบันทึก lead เข้าตาราง `leads` บน Supabase อัตโนมัติแล้ว (ทดสอบแล้ว) ดู lead ที่เข้ามาได้ที่
Supabase dashboard → Table Editor → `leads` · โค้ด/คีย์อยู่ใน `assets/js/app.js`
(`saveLeadToSupabase`) ถ้าต้องเปลี่ยน project/คีย์ในอนาคต แก้ 2 บรรทัดบนสุดของ `app.js`:

1. สร้างโปรเจกต์ฟรีที่ https://supabase.com (New project)
2. ไปที่ **SQL Editor → New query** คัดลอกเนื้อหาทั้งหมดจากไฟล์ `supabase/schema.sql`
   ในโปรเจกต์นี้ไปวาง แล้วกด **Run** (สร้างตาราง `leads` + ตั้งค่าความปลอดภัยให้เสร็จในคำสั่งเดียว)
3. ไปที่ **Project Settings → API** คัดลอก **Project URL** และ **anon public key**
4. เปิด `assets/js/app.js` แก้ 2 บรรทัดนี้ใกล้ด้านบนไฟล์:
   ```js
   var SUPABASE_URL = "YOUR_SUPABASE_URL";        // → วาง Project URL
   var SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // → วาง anon public key
   ```
5. `git add -A && git commit -m "Connect Supabase" && git push` — Vercel deploy ให้อัตโนมัติ

ดูข้อมูล lead ที่ส่งเข้ามาได้ที่ Supabase dashboard → **Table Editor → leads**
(ตั้งใจให้ anon key ใส่ข้อมูลได้อย่างเดียว อ่าน/แก้/ลบไม่ได้ — ต้อง login เข้า dashboard เท่านั้น)

อยากต่อแจ้งเตือนไป Line/Telegram ทันทีที่มี lead ใหม่ด้วย ทำได้ผ่าน **Supabase Database
Webhooks** (Database → Webhooks → สร้าง webhook ยิงไปที่ URL ของ n8n/Make/Zapier เมื่อมีแถวใหม่
ในตาราง `leads`) — บอกได้ถ้าอยากให้ช่วยตั้งค่าส่วนนี้ต่อ

## 🌏 เพิ่มภาษาจีน (ภายหลัง)
ระบบภาษาใช้ `<span class="lang-en">` / `<span class="lang-th">` คู่กัน
เพิ่มภาษาจีนได้โดยเพิ่ม `lang-zh` และเพิ่มปุ่ม `ZH` ใน `#langSwitch` + logic ใน `setLang`

## 🚀 ออนไลน์อยู่แล้ว
เว็บ deploy อยู่บน Vercel แล้วที่ **https://siamelite.vercel.app** เชื่อมกับ GitHub repo
`ratthakans/siamelite` — แค่ `git push` ขึ้น `main` เว็บจะ deploy เวอร์ชันใหม่ให้อัตโนมัติ

**โดเมนของตัวเอง**: ไปที่ Vercel dashboard → โปรเจกต์ `siamelite` → Settings → Domains →
เพิ่มโดเมนแล้วชี้ DNS ตามที่ Vercel บอก (รองรับ HTTPS ให้อัตโนมัติ)

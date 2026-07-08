# Siam Elite Consulting — Website

เว็บไซต์ 2 ภาษา (ไทย/อังกฤษ) สำหรับ Siam Elite Consulting
โทนน้ำเงินเข้ม + ทอง สไตล์ **startup / liquid glass** — พื้นหลัง gradient mesh ต่อเนื่องทั้งหน้า
การ์ด/แถบต่างๆ ใช้เอฟเฟกต์กระจกฝ้า (`backdrop-filter: blur()` + พื้นโปร่งแสง) ลอยอยู่ด้านบน

## เปิดดูเว็บ
เว็บนี้เป็น **static site** (ไม่มี build step) แต่ตอนนี้ property listings โหลดจากไฟล์ JSON ผ่าน
`fetch()` ซึ่งเบราว์เซอร์ส่วนใหญ่บล็อก fetch จากไฟล์ `file://` ตรงๆ — ต้องรันผ่านเว็บเซิร์ฟเวอร์
เล็กๆ (ในเครื่องนี้มี `.claude/server.js` ให้แล้ว: `node .claude/server.js`) หรือใช้
`npx serve` / VS Code Live Server ก็ได้

## โครงสร้างไฟล์
```
index.html                    หน้าแรก (hero, วีซ่า, อสังหาฯ ทีเซอร์, about, ฟอร์ม, footer)
properties.html               หน้าอสังหาริมทรัพย์ทั้งหมด (filter เต็มรูปแบบ + ฟอร์มส่งความสนใจ)
assets/css/styles.css         ธีม/ดีไซน์ทั้งหมด (ปรับสีที่ตัวแปร :root ด้านบนไฟล์)
assets/js/app.js              ภาษา / เมนูมือถือ / ปุ่มลอย / ฟอร์มทีละขั้น / โหลด+กรองอสังหาฯ
assets/data/properties.json   ข้อมูลทรัพย์ทั้งหมด (แก้ตรงนี้ หรือแก้ผ่าน CMS ก็ได้ — ดูด้านล่าง)
assets/img/properties/        รูปภาพทรัพย์ (แก้ไข/แทนที่ได้ผ่าน CMS เช่นกัน)
admin/                        ระบบหลังบ้าน (CMS) สำหรับแก้ไขรายการทรัพย์ — ดูหัวข้อถัดไป
```

## 🌐 Stack ที่ใช้จริงตอนนี้
- **GitHub**: [github.com/ratthakans/siamelite](https://github.com/ratthakans/siamelite) — เก็บโค้ดทั้งหมด
- **Vercel**: [siamelite.vercel.app](https://siamelite.vercel.app) — โฮสต์เว็บ เชื่อมกับ GitHub แล้ว
  **push ขึ้น `main` เมื่อไหร่ เว็บ deploy ใหม่ให้อัตโนมัติทันที** (ทดสอบแล้วว่าทำงานจริง)
- **Decap CMS** (`/admin`) — แก้ไขรายการทรัพย์ผ่านเบราว์เซอร์ ไม่ต้องแตะโค้ด
- **Supabase** — เก็บข้อมูล lead จากฟอร์มติดต่อ (ยังต้องตั้งค่าเพิ่ม ดูหัวข้อด้านล่าง)

## 🖥️ ระบบหลังบ้าน (CMS) — แก้ไขรายการทรัพย์โดยไม่ต้องแตะโค้ด
**Decap CMS** (git-based — ไม่มี database แยก) อยู่ที่ `/admin` แก้ไขแล้ว commit เข้า
`assets/data/properties.json` ในโค้ดโดยตรง ซึ่งจะ trigger ให้ Vercel deploy ใหม่อัตโนมัติ

**ทดสอบในเครื่องได้ทันที (ไม่ต้องรอ setup ด้านล่าง):**
1. รันเว็บเซิร์ฟเวอร์ (ดูหัวข้อ "เปิดดูเว็บ" ด้านบน)
2. เปิด terminal อีกหน้าต่าง: `cd "เส้นทางไปโฟลเดอร์เว็บนี้" && PORT=8478 npx decap-server`
3. เปิด `http://localhost:<พอร์ตเว็บ>/admin/` แล้วกด "Login" (โหมดทดสอบไม่ต้องใส่รหัส)
4. แก้ไข/เพิ่ม/ลบรายการทรัพย์ได้เลย — ชื่อ (ไทย/อังกฤษ), ราคา, ทำเล, ห้องนอน/น้ำ, พื้นที่,
   สถานะขาย/เช่า, ระดับงบประมาณ, รูปภาพ, ติ๊ก "แสดงในหน้าแรก"
5. กด **Publish** — เขียนไฟล์ `assets/data/properties.json` ทันที (ทดสอบแล้วว่าทำงานจริง)
   แต่โหมดทดสอบนี้ยังไม่ commit เข้า git อัตโนมัติ ต้อง `git add` + `git commit` + `git push` เอง

**เปิดให้ login แก้ไขจากที่ไหนก็ได้ (production) — ต้องสร้าง GitHub OAuth App เอง:**

เว็บ host อยู่บน Vercel ไม่ใช่ Netlify ทำให้ไม่มี Netlify Identity ให้ใช้ฟรีๆ แบบเดิม
แต่ยังใช้ Netlify's OAuth proxy (บริการฟรี ไม่ต้อง host เว็บบน Netlify) เป็นตัวกลางได้:

1. สร้าง GitHub OAuth App ที่ https://github.com/settings/developers → **New OAuth App**
   - Application name: `Siam Elite CMS` (ชื่ออะไรก็ได้)
   - Homepage URL: `https://siamelite.vercel.app`
   - Authorization callback URL: `https://api.netlify.com/auth/done` **(ต้องเป๊ะตรงนี้)**
   - กด Register แล้วคัดลอก **Client ID** และกด "Generate a new client secret" คัดลอก **Client Secret**
2. สร้างเว็บไซต์เปล่าๆ บน Netlify สักอัน (ไม่ต้อง deploy อะไรจริง แค่ใช้เป็นตัวกลาง OAuth ฟรี)
   ไปที่ **Site settings → Access control → OAuth → Install provider → GitHub**
   แล้วใส่ Client ID / Client Secret จากขั้นตอนก่อนหน้า
3. เข้า `https://siamelite.vercel.app/admin/` กด Login → จะเด้งไป GitHub ให้อนุญาต →
   เสร็จแล้วกลับมาแก้ไขได้เลย กด Publish จะ commit เข้า GitHub repo จริง → Vercel deploy ให้เอง
4. อยากเพิ่มคนแก้ไข (เช่น เซลล์/แอดมิน) ให้เชิญเป็น **Collaborator** ในหน้า GitHub repo settings
   (Settings → Collaborators) **จำกัดเฉพาะคนที่ไว้ใจได้** เพราะแก้ไขแล้วขึ้นเว็บจริงทันที

Config ของ CMS อยู่ที่ `admin/config.yml` — ตอนนี้ตั้งไว้ให้แก้ไขได้เฉพาะ "รายการทรัพย์"
เท่านั้น (จุดที่เปลี่ยนบ่อยที่สุด) ถ้าอยากให้แก้ วีซ่า/รีวิว/เกี่ยวกับเราได้ผ่าน CMS ด้วย
บอกได้ครับ เพิ่ม collection ใหม่ในไฟล์นี้ได้ไม่ยาก

## 🎨 ธีมสี
ยึดสัดส่วน **ขาว 60% · navy 30% · ทอง 10%** ปรับสีได้ที่ตัวแปร `:root` ด้านบนของ
`assets/css/styles.css` ค่าเริ่มต้นเป็น **ภาษาไทย** (ผู้เข้าชมกดสลับ EN ได้ที่มุมขวาบน)

## ⚠️ สำคัญที่สุด: รูปและข้อมูลอสังหาฯ ยังเป็นข้อมูลตัวอย่าง
รายการทรัพย์ทั้ง 6 รายการ (ชื่อ, ราคา, ทำเล, **รูปภาพ**) เป็นข้อมูลตัวอย่างจากภาพสต็อก
(Unsplash — ใช้เชิงพาณิชย์ได้ฟรี แต่**ไม่ใช่ภาพบ้าน/คอนโดจริงของคุณ**)

**ห้ามปล่อยเว็บขึ้นจริงโดยไม่เปลี่ยนเป็นข้อมูล/รูปทรัพย์จริง** — การใช้ภาพสต็อกแทนภาพทรัพย์จริง
ในธุรกิจอสังหาฯ อาจทำให้ลูกค้าเข้าใจผิดว่าเป็นทรัพย์ที่มีอยู่จริง แก้ไขได้ง่ายที่สุดผ่าน
**CMS ที่ `/admin`** (ดูหัวข้อด้านบน) — ไม่ต้องแตะโค้ดเลย

## ✅ สิ่งที่ต้องแก้ให้เป็นข้อมูลจริง (ไล่ทีละจุด)
1. **โลโก้จริง** — ตอนนี้ใช้โลโก้ SVG ตัวยืน 2 ไฟล์:
   - `assets/img/logo.svg` — สี navy+ทอง พื้นใส
   - `assets/img/logo-gold.svg` — สีทอง พื้นใส (ใช้ทั้ง header และ footer ตอนนี้)
   เอาไฟล์โลโก้มังกรจริงของคุณ (แนะนำเป็น **PNG พื้นหลังใส**) มาวางแล้วแก้ path ใน `index.html`
   และ `properties.html` — หรือทับไฟล์ `.svg` เหล่านี้ได้เลย มีสคริปต์ช่วยทำสี/ลบพื้นหลัง
   อัตโนมัติที่ `assets/tools/make_logo.py`
2. **รูปและข้อมูลอสังหาฯ** — ดูหัวข้อด้านบน (สำคัญมาก) แก้ผ่าน `/admin` ได้เลย
3. **เบอร์โทร / Line / WhatsApp / WeChat** — ค้นหา `+66000000000`, `@siamelite`,
   `wa.me/66000000000`, `hello@siamelite.co` แล้วแทนด้วยของจริง (อยู่ใน header, footer, ปุ่มลอย)
4. **เลขทะเบียนบริษัท** — แก้ `Company Reg. No. 0000000000000` ใน section About (`index.html`)
5. **Google Map** — ในกล่อง "Our Office" (`.about-media`) ตอนนี้ใช้ภาพวัดเชียงใหม่ (Unsplash)
   เป็นพื้นหลังประกอบบรรยากาศชั่วคราว แทนที่ด้วย `<iframe>` แผนที่จริงของสำนักงานคุณ
6. **รีวิวลูกค้า** — เปลี่ยนข้อความ testimonial เป็นรีวิวจริง (ยิ่งมีรูปคู่ทีมงานยิ่งดี)

## 🔎 ระบบ filter อสังหาฯ ทำงานอย่างไร
`assets/js/app.js` จะ `fetch()` ข้อมูลจาก `assets/data/properties.json` มาสร้างการ์ดใส่ใน
`#propGrid` แล้วค่อยผูกระบบกรอง (`initPropertyFilters`) หน้าแรก (`index.html`) แสดงเฉพาะรายการ
ที่ติ๊ก `featured: true` ส่วนหน้า `properties.html` แสดงทุกรายการ — filter ทำงาน real-time
ไม่ต้องกด "ค้นหา" เพิ่ม/ลบทรัพย์ทำได้ทั้งแก้ JSON ตรงๆ หรือผ่าน CMS (`/admin`)

> หมายเหตุ: บริการ **แลกเงิน (Currency Exchange) ถูกถอดออกชั่วคราว** (รอใบอนุญาต) — เว็บตอนนี้เน้น
> วีซ่า + อสังหาฯ/แม่บ้าน โค้ด CSS ของ section แลกเงินยังเก็บไว้ในไฟล์ พร้อมเปิดกลับเมื่อพร้อม

## 🔗 ฟอร์มติดต่อ → Supabase (ยังต้องตั้งค่า)
ฟอร์มเชื่อมไว้กับ **Supabase** แล้วในโค้ด (`assets/js/app.js` → ฟังก์ชัน `saveLeadToSupabase`)
แต่ยังไม่ทำงานจริงจนกว่าจะตั้งค่า เพราะผมสร้าง Supabase project ให้ไม่ได้ (ต้องใช้บัญชีของคุณ):

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

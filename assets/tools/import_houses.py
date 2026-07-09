#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Import real rental houses from the local Drive download into properties.json + copy photos."""
import zipfile, re, os, glob, json, html, shutil, subprocess

SRC = "/Users/ratthakan/Downloads/บ้าน , 家"
PROJ = "/Users/ratthakan/Desktop/Siam Elite"
IMG_OUT = os.path.join(PROJ, "assets", "img", "properties")

def docx_text(path):
    try:
        z = zipfile.ZipFile(path); xml = z.read('word/document.xml').decode('utf-8', 'ignore')
    except Exception:
        return ""
    xml = re.sub(r'</w:p>', '\n', xml); xml = re.sub(r'<[^>]+>', '', xml)
    return html.unescape(xml)

def num(s):
    m = re.sub(r'[^\d]', '', s or ''); return int(m) if m else None

# zone mapping by keyword in folder name
ZONES = [
    (["สารภี", "ขัวมุง"], "saraphi", "สารภี", "Saraphi"),
    (["สันทราย", "แม่โจ้", "สันนาเม็ง", "พิมมดา", "พิมุกต์", "belive", "สันสาราญ", "sansaran"], "sansai", "สันทราย / แม่โจ้", "Sansai / Mae Jo"),
    (["หางดง", "สันผักหวาน", "กุลพันธ์"], "hangdong", "หางดง", "Hang Dong"),
    (["สันกำแพง", "ซีรีน", "serene"], "sankamphaeng", "สันกำแพง", "San Kamphaeng"),
    (["หนองหอย", "ฟ้าฮ่าม", "พายัพ", "cmis", "ท่าเกวียน", "หนอง"], "mueang", "ในเมือง / รอบเมือง", "Mueang (city area)"),
    (["แอร์พอร์ต", "สนามบิน", "ล้านนาวิลเลจ", "กาญจน์ทาวน์", "กาญจน์กนก"], "airport", "โซนสนามบิน", "Airport zone"),
    (["สะเมิง"], "hangdong", "แม่ริม / สะเมิง", "Mae Rim / Samoeng"),
]

def zone_of(folder):
    low = folder.lower()
    for keys, code, th, en in ZONES:
        if any(k.lower() in low for k in keys):
            return code, th, en
    return "other", "เชียงใหม่", "Chiang Mai"

# feature keyword detection -> bilingual
FEATS = [
    (["สระว่ายน้ำส่วนกลาง", "สระว่ายน้ำ", "泳池", "pool"], "สระว่ายน้ำ", "Swimming pool"),
    (["ฟิตเนส", "fitness", "健身"], "ฟิตเนส", "Fitness centre"),
    (["รปภ", "security", "安保", "24 ชั่วโมง", "รักษาความปลอดภัย"], "รปภ. 24 ชม.", "24h security"),
    (["โรงเรียนนานาชาติ", "international school", "国际学校"], "ใกล้โรงเรียนนานาชาติ", "Near international school"),
    (["เลี้ยงสัตว์ได้", "สัตว์เลี้ยงได้", "pet friendly"], "เลี้ยงสัตว์ได้", "Pet friendly"),
    (["สวน", "garden", "ผลไม้"], "มีสวน", "Garden"),
    (["ใกล้เมือง", "ตัวเมือง", "city center", "city centre", "เข้าเมือง"], "เดินทางเข้าเมืองสะดวก", "Close to the city"),
    (["โฮมโปร", "โลตัส", "big c", "เซ็นทรัล", "central", "ห้าง", "shopping"], "ใกล้ห้าง/แหล่งช้อปปิ้ง", "Near shopping"),
]

CONTACT_MARKERS = re.compile(r'(ติดต่อ|inbox|โทร|Facebook|facebook|https?://|line\s*[:：]|wechat|โทรศัพท์|เบอร์|สนใจ.*\d|โทร\.|Tel|电话|微信|\+?\d{2,3}[- ]?\d{3}[- ]?\d{3,4}|\d{3}[- ]\d{3}[- ]?\d{4})', re.I)

def clean_desc(txt, lang="th"):
    # take lines until a contact marker; keep meaningful bullet lines
    lines = [l.strip() for l in txt.splitlines()]
    kept = []
    for l in lines:
        if not l:
            continue
        if CONTACT_MARKERS.search(l):
            break
        # skip pure chinese block if we want th
        kept.append(l)
        if len(" ".join(kept)) > 420:
            break
    d = " ".join(kept)
    d = re.sub(r'\s+', ' ', d).strip()
    return d[:500]

def en_block(txt):
    m = re.search(r'(House for Rent[\s\S]{80,600})', txt)
    if m:
        seg = m.group(1)
        seg = seg.split("Tel")[0].split("电话")[0].split("Line")[0]
        seg = re.sub(r'\s+', ' ', seg).strip()
        return seg[:460]
    return None

folders = sorted([d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d))])
listings = []
idx = 0
for f in folders:
    fpath = os.path.join(SRC, f)
    docs = [x for x in glob.glob(os.path.join(fpath, "*.docx")) if not os.path.basename(x).startswith("~$")]
    pick = next((x for x in docs if "ใหม่" in x), None) or (docs[0] if docs else None)
    txt = docx_text(pick) if pick else ""
    photos = sorted(glob.glob(os.path.join(fpath, "*.jpg")) + glob.glob(os.path.join(fpath, "*.JPG")))
    if not photos:
        print("SKIP (no photos):", f); continue

    price = None
    for pat in [r'ให้เช่า\s*([\d,]+)', r'เช่า(?:เดือนละ|ด|)\s*([\d,]+)', r'Rent[^\d]*([\d,]+)', r'租金[：:]\s*([\d,]+)', r'([\d,]+)\s*(?:บาท)?\s*/\s*เดือน', r'เดือนละ\s*([\d,]+)']:
        m = re.search(pat, txt)
        if m and num(m.group(1)) and 3000 <= num(m.group(1)) <= 500000:
            price = num(m.group(1)); break
    if not price:
        print("SKIP (no price):", f); continue
    beds = (re.search(r'(\d+)\s*ห้องนอน', txt) or [None, None])[1]
    baths = (re.search(r'(\d+)\s*ห้องน้ำ', txt) or [None, None])[1]
    beds = int(beds) if beds else 3
    baths = int(baths) if baths else 2
    m = re.search(r'([\d,]+)\s*(?:ตร\.?ม\.?|ตารางเมตร)', txt); sqm = num(m.group(1)) if m else None
    m = re.search(r'([\d,]+)\s*(?:ตร\.?ว\.?|ตารางวา|ตรว)', txt); wah = num(m.group(1)) if m else None
    land_sqm = wah * 4 if wah else None
    if not sqm:
        sqm = land_sqm or 150
        if land_sqm == sqm:
            land_sqm = None
    m = re.search(r'จอดรถ(?:ได้)?\s*(\d+)', txt); parking = int(m.group(1)) if m else 2

    idx += 1
    code = "SE-R%02d" % idx
    zcode, zth, zen = zone_of(f)
    ptype = "condo" if (sqm and sqm < 45) else "house"
    tier = "a" if price < 20000 else ("b" if price < 30000 else "c")

    # title: clean folder name
    title_th = re.sub(r'\s+', ' ', f).strip()
    title_th = re.sub(r'^(โครงการ|หมู่บ้าน)\s*', '', title_th)
    title_en = "House for Rent · " + zen

    feats = []
    low = txt.lower()
    for keys, fth, fen in FEATS:
        if any(k.lower() in low for k in keys):
            feats.append({"th": fth, "en": fen})
        if len(feats) >= 5:
            break

    desc_th = clean_desc(txt)
    desc_en = en_block(txt) or ("A %d-bedroom home for rent in %s, Chiang Mai. Fully furnished and ready to move in." % (beds, zen))

    # copy up to 5 largest photos
    photos_by_size = sorted(photos, key=lambda p: os.path.getsize(p), reverse=True)[:5]
    gallery = []
    for i, ph in enumerate(photos_by_size):
        outname = "r%02d-%d.jpg" % (idx, i + 1)
        outpath = os.path.join(IMG_OUT, outname)
        shutil.copy(ph, outpath)
        subprocess.run(["sips", "-Z", "1400", outpath], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        gallery.append("assets/img/properties/" + outname)

    listings.append({
        "code": code, "featured": idx <= 6, "status": "rent", "type": ptype,
        "location": zcode, "location_th": zth, "location_en": zen,
        "title_th": title_th, "title_en": title_en,
        "desc_th": desc_th, "desc_en": desc_en,
        "beds": beds, "baths": baths, "sqm": sqm, "land_sqm": land_sqm,
        "parking": parking, "floor": None, "furnished": "full", "ownership": "rental",
        "price_th": "฿ %s / เดือน" % format(price, ","), "price_en": "฿ %s / mo" % format(price, ","),
        "tier": tier, "image": gallery[0], "gallery": gallery, "features": feats
    })
    print("OK %s | %s | %s | %d bed %d bath | %s sqm | ฿%s | %d photos" % (code, title_th[:28], zcode, beds, baths, sqm, format(price, ","), len(gallery)))

json.dump({"listings": listings}, open(os.path.join(PROJ, "assets/data/properties.json"), "w"), ensure_ascii=False, indent=2)
print("\nTOTAL:", len(listings), "listings written to properties.json")

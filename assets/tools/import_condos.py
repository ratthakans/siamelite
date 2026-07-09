#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Import real condos from the local Drive download; APPEND to properties.json + copy photos + upsert-ready."""
import zipfile, re, os, glob, json, html, shutil, subprocess

SRC = "/Users/ratthakan/Downloads/คอนโด , 公寓"
PROJ = "/Users/ratthakan/Desktop/Siam Elite"
IMG_OUT = os.path.join(PROJ, "assets", "img", "properties")
JSON_PATH = os.path.join(PROJ, "assets/data/properties.json")

def docx_text(path):
    try:
        xml = zipfile.ZipFile(path).read('word/document.xml').decode('utf-8', 'ignore')
    except Exception:
        return ""
    xml = re.sub(r'</w:p>', '\n', xml); xml = re.sub(r'<[^>]+>', '', xml)
    return html.unescape(xml)

def num(s):
    m = re.sub(r'[^\d]', '', s or ''); return int(m) if m else None

def zone_of(folder, txt):
    low = (folder + " " + txt).lower()
    if any(k in low for k in ["nimmana", "nimman", "นิมมาน", "สันติธรรม", "santitham"]):
        return "nimman", "นิมมาน", "Nimman"
    if any(k in low for k in ["ช้างคลาน", "chang klan", "shangri", "ช้างเผือก"]):
        return "mueang", "ช้างคลาน / ในเมือง", "Chang Klan / City"
    if any(k in low for k in ["เจ็ดยอด", "jed yod", "รวมโชค", "เซนเฟส", "central festival", "คลองชล", "เจ็ดยอด"]):
        return "mueang", "ในเมือง / รอบเมือง", "Mueang (city area)"
    return "mueang", "ในเมือง / รอบเมือง", "Mueang (city area)"

CONTACT = re.compile(r'(ติดต่อ|inbox|โทร|Tel|电话|Facebook|https?://|line\s*[:：]|wechat|微信|เจ้าของ|#|096|\+?\d{2,3}[- ]?\d{3}[- ]?\d{3,4})', re.I)
FEATS = [
    (["สระว่ายน้ำ", "泳池", "pool"], "สระว่ายน้ำ", "Swimming pool"),
    (["ฟิตเนส", "fitness", "健身"], "ฟิตเนส", "Fitness centre"),
    (["co-working", "coworking", "co working"], "Co-working space", "Co-working space"),
    (["รปภ", "security", "安保", "24"], "รปภ. 24 ชม.", "24h security"),
    (["นิมมาน", "nimman", "maya", "one nimman"], "ใจกลางย่านนิมมาน", "Heart of Nimman"),
    (["มหาวิทยาลัยเชียงใหม่", "chiang mai university", "cmu"], "ใกล้ ม.เชียงใหม่", "Near CMU"),
    (["digital nomad", "expat", "ชาวต่างชาติ"], "เหมาะกับชาวต่างชาติ / Digital Nomad", "Great for expats & nomads"),
]

def clean_desc(txt):
    lines = []
    for l in txt.splitlines():
        l = l.strip()
        if not l:
            continue
        if CONTACT.search(l):
            break
        # skip lines that are mostly non-thai/en marketing repeats after first block
        lines.append(l)
        if len(" ".join(lines)) > 420:
            break
    d = re.sub(r'\s+', ' ', " ".join(lines)).strip()
    # strip leading emoji clutter
    return d[:500]

def en_block(txt):
    m = re.search(r'((?:Condo|Apartment|Studio)[^\n]*for Rent[\s\S]{60,520})', txt)
    if not m:
        m = re.search(r'(Rental Rates[\s\S]{40,400})', txt)
    if m:
        seg = m.group(1).split("Contact")[0].split("Tel")[0].split("电话")[0]
        return re.sub(r'\s+', ' ', seg).strip()[:460]
    return None

# load existing listings (keep houses)
data = json.load(open(JSON_PATH, encoding="utf-8"))
listings = data["listings"]
existing_codes = {p["code"] for p in listings}

folders = sorted([d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d))])
idx = 0
added = 0
for f in folders:
    fpath = os.path.join(SRC, f)
    docs = [x for x in glob.glob(os.path.join(fpath, "*.docx")) if not os.path.basename(x).startswith("~$")]
    pick = next((x for x in docs if "ใหม่" in x), None) or (docs[0] if docs else None)
    txt = docx_text(pick) if pick else ""
    photos = sorted(glob.glob(os.path.join(fpath, "*.jpg")) + glob.glob(os.path.join(fpath, "*.JPG")))
    if not photos or not txt:
        print("SKIP (no photos/text):", f); continue

    price = None
    for pat in [r'ค่าเช่า[^\d]*([\d,]+)', r'ราคาเช่า[^\d]*([\d,]+)', r'ให้เช่า[^\d]*([\d,]+)', r'([\d,]+)\s*(?:บาท)?\s*/\s*เดือน', r'Rent[^\d]*([\d,]+)', r'THB\s*([\d,]+)', r'租金[：:]\s*([\d,]+)', r'([\d,]+)\s*泰铢']:
        m = re.search(pat, txt)
        if m and num(m.group(1)) and 3000 <= num(m.group(1)) <= 900000:
            price = num(m.group(1)); break
    if not price:
        print("SKIP (no price):", f); continue

    status = "rent"
    if re.search(r'(ราคาขาย|for sale|出售|ขายราคา)', txt, re.I) and price > 400000:
        status = "sale"

    m = re.search(r'(\d+)\s*ห้องนอน', txt); beds = int(m.group(1)) if m else None
    if beds is None:
        beds = 1 if re.search(r'(สตูดิโอ|studio|单间)', txt, re.I) else 1
    m = re.search(r'(\d+)\s*ห้องน้ำ', txt); baths = int(m.group(1)) if m else 1
    m = re.search(r'([\d,]+)\s*(?:ตร\.?ม\.?|ตารางเมตร|sq\.?m|平方米)', txt); sqm = num(m.group(1)) if m else 35
    m = re.search(r'ชั้น\s*(\d+)', txt) or re.search(r'(\d+)\s*(?:th|st|nd|rd)?\s*floor', txt, re.I) or re.search(r'(\d+)\s*楼', txt)
    floor = int(m.group(1)) if m else None
    m = re.search(r'จอดรถ[^\d]*(\d+)', txt); parking = int(m.group(1)) if m else 1

    idx += 1
    code = "SE-C%02d" % idx
    if code in existing_codes:
        continue
    zc, zth, zen = zone_of(f, txt)
    tier = "a" if price < 20000 else ("b" if price < 30000 else "c")
    title_th = re.sub(r'\s+', ' ', f).strip()
    title_en = re.sub(r'\s+', ' ', f).strip()

    feats = []
    low = txt.lower()
    for keys, fth, fen in FEATS:
        if any(k.lower() in low for k in keys):
            feats.append({"th": fth, "en": fen})
        if len(feats) >= 5:
            break

    desc_th = clean_desc(txt)
    desc_en = en_block(txt) or ("A %d-bedroom condo for rent in %s, Chiang Mai. Fully furnished and ready to move in." % (beds, zen))

    photos_by_size = sorted(photos, key=lambda p: os.path.getsize(p), reverse=True)[:5]
    gallery = []
    for i, ph in enumerate(photos_by_size):
        outname = "c%02d-%d.jpg" % (idx, i + 1)
        outpath = os.path.join(IMG_OUT, outname)
        shutil.copy(ph, outpath)
        subprocess.run(["sips", "-Z", "1400", outpath], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        gallery.append("assets/img/properties/" + outname)

    price_label_th = ("฿ %s / เดือน" % format(price, ",")) if status == "rent" else ("฿ %s" % format(price, ","))
    price_label_en = ("฿ %s / mo" % format(price, ",")) if status == "rent" else ("฿ %s" % format(price, ","))

    listings.append({
        "code": code, "featured": idx <= 3, "status": status, "type": "condo",
        "location": zc, "location_th": zth, "location_en": zen,
        "title_th": title_th, "title_en": title_en,
        "desc_th": desc_th, "desc_en": desc_en,
        "beds": beds, "baths": baths, "sqm": sqm, "land_sqm": None,
        "parking": parking, "floor": floor, "furnished": "full", "ownership": "rental" if status == "rent" else "foreign-quota",
        "price_th": price_label_th, "price_en": price_label_en,
        "tier": tier, "image": gallery[0], "gallery": gallery, "features": feats
    })
    added += 1
    print("OK %s | %-26s | %s | %sbd fl.%s | %ssqm | ฿%s | %d ph" % (code, title_th[:26], zc, beds, floor, sqm, format(price, ","), len(gallery)))

json.dump({"listings": listings}, open(JSON_PATH, "w"), ensure_ascii=False, indent=2)
print("\nAdded %d condos. Total listings now: %d" % (added, len(listings)))

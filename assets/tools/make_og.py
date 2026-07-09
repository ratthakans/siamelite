#!/usr/bin/env python3
"""Generate a 1200x630 Open Graph share image for Siam Elite Consulting."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
IMG = os.path.join(ROOT, "assets", "img")

W, H = 1200, 630
NAVY = (11, 24, 54)
GOLD = (212, 166, 60)
GOLD_LT = (242, 212, 137)
CREAM = (237, 231, 218)

# base: hero photo, cropped to fill
base = Image.open(os.path.join(IMG, "hero-bg.jpg")).convert("RGB")
bw, bh = base.size
scale = max(W / bw, H / bh)
base = base.resize((int(bw * scale), int(bh * scale)))
bx = (base.size[0] - W) // 2
by = (base.size[1] - H) // 2
base = base.crop((bx, by, bx + W, by + H))

# navy gradient overlay (stronger on the left for text legibility)
overlay = Image.new("RGB", (W, H), NAVY)
mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(mask)
for x in range(W):
    a = int(240 - (x / W) * 150)  # 240 -> 90
    md.line([(x, 0), (x, H)], fill=max(70, a))
img = Image.composite(overlay, base, mask)

d = ImageDraw.Draw(img)

def font(path, size):
    return ImageFont.truetype(path, size)

ARIAL_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
GEORGIA_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
serif_b = GEORGIA_B if os.path.exists(GEORGIA_B) else ARIAL_B

f_brand = font(serif_b, 74)
f_sub = font(ARIAL_B, 34)
f_eye = font(ARIAL_B, 24)

PAD = 80

# gold SE seal (drawn)
cx, cy, r = PAD + 46, 92, 46
d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=3)
d.ellipse([cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10], outline=GOLD, width=1)
f_se = font(serif_b, 44)
sew = d.textlength("SE", font=f_se)
d.text((cx - sew / 2, cy - 30), "SE", font=f_se, fill=GOLD_LT)

# eyebrow
d.text((PAD, 250), "ELITE LIVING IN CHIANG MAI", font=f_eye, fill=GOLD_LT)
# brand
d.text((PAD, 292), "Siam Elite Consulting", font=f_brand, fill=(255, 255, 255))
# gold rule
d.line([(PAD, 400), (PAD + 120, 400)], fill=GOLD, width=4)
# subtitle
d.text((PAD, 428), "Visa  ·  Property  ·  Maid Services", font=f_sub, fill=CREAM)
d.text((PAD, 476), "Your trusted one-stop partner in Chiang Mai", font=font(ARIAL_B, 26), fill=(174, 185, 208))

out = os.path.join(IMG, "og-cover.jpg")
img.save(out, quality=88)
print("wrote", out, img.size)

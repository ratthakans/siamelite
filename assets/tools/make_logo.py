#!/usr/bin/env python3
"""
Recolour the Siam Elite logo (black line-art on white) into transparent,
tinted PNGs — without altering the artwork itself.

Usage:
    python3 make_logo.py <source_image>

Produces in ../img/ :
    logo.png        navy   (#12325C) — for light backgrounds (header)
    logo-light.png  cream  (#EDE7DA) — for the navy footer
    logo-gold.png   gold   (#BF9D4E) — optional accent variant

How it works: the drawing's darkness becomes the alpha channel
(dark = opaque, white = transparent), then filled with a flat colour.
This keeps every scale and whisker of the dragon, just in one colour,
with a clean transparent background.
"""
import sys, os
from PIL import Image

def build(src_path):
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.normpath(os.path.join(here, "..", "img"))

    src = Image.open(src_path).convert("RGBA")
    # Flatten onto white so a transparent OR white background both normalise.
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    lum = Image.alpha_composite(white, src).convert("L")   # luminance 0..255
    # alpha = how dark the pixel is (black art -> opaque, white -> clear)
    alpha = lum.point(lambda x: 255 - x)

    variants = {
        "logo.png":       (18, 50, 92),    # navy  #12325C
        "logo-light.png": (237, 231, 218), # cream #EDE7DA
        "logo-gold.png":  (191, 157, 78),  # gold  #BF9D4E
    }
    for name, (r, g, b) in variants.items():
        layer = Image.new("RGBA", src.size, (r, g, b, 0))
        layer.putalpha(alpha)
        # trim fully-transparent border, then pad a little for breathing room
        bbox = layer.getbbox()
        if bbox:
            layer = layer.crop(bbox)
        pad = max(layer.size) // 20
        canvas = Image.new("RGBA", (layer.size[0] + pad * 2, layer.size[1] + pad * 2), (0, 0, 0, 0))
        canvas.paste(layer, (pad, pad), layer)
        canvas.save(os.path.join(out_dir, name))
        print("wrote", os.path.join(out_dir, name), canvas.size)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 make_logo.py <source_image>")
        sys.exit(1)
    build(sys.argv[1])

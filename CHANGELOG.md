# Changelog

All notable changes to the Siam Elite Consulting website.

## [1.0.0] — 2026-07-11

First official public release.

### Site
- Trilingual site: Thai (default), English (in-page toggle), and a dedicated Chinese landing page (`zh.html`).
- Premium minimal design system — navy + refined gold, one modular type scale, IBM Plex Sans Thai / Noto Sans SC for readable multilingual text.
- Clean split hero with a real luxury-villa photo and a floating "reply in 30 min" badge.
- Real Chiang Mai imagery in the Visa and About sections; gold seal used as a subtle brand watermark.

### Property listings
- 45 real listings (28 houses + 17 condos) with full specs, real photos, and individual detail pages.
- Filter by status / type / location / bedrooms / budget + keyword search + **sort by price**.
- Data in `assets/data/properties.json`, mirrored to a Supabase `properties` table.
- Owner contact details stripped from all listing content for privacy.

### Lead capture & contact
- Multi-step lead form → Supabase (`leads`, insert-only RLS), consent gate (PDPA), honeypot anti-spam.
- Real channels wired site-wide: LINE Official Account, WhatsApp (+66 94-775-5746), phone (096-697-3102),
  WeChat, Facebook, email (siameliteconsulting@gmail.com). Brand-glyph contact icons.

### Trust, legal & SEO
- Registered-company details, Google Maps office embed, PDPA Privacy Policy + Terms.
- `robots.txt`, `sitemap.xml` (50 URLs), per-page canonical/OG, dynamic per-property canonical/OG/image.
- Schema.org RealEstateAgent + per-property structured data.

### Quality & production
- Accessibility: keyboard focus-visible rings, `prefers-reduced-motion`, alt text, ARIA labels, `<noscript>` fallback.
- Security headers + image caching via `vercel.json`; `theme-color` + Apple touch icon.
- Branded 404 page. No console errors; no horizontal overflow across pages/breakpoints.

### Pending (client-provided, non-blocking)
- GA4 / Meta Pixel IDs (analytics scaffold ready in `assets/js/app.js`).
- Real team photos/names and customer reviews (Team + Testimonials sections built but hidden).
- Custom domain + branded email (currently on `siamelite.vercel.app` with a working Gmail address).

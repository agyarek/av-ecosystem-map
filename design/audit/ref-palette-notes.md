# Reference palette — interpretation of quantization (main session, Phase 1)

Source: ref-palette-raw.md (quantize --top 14, 4x downscale, cluster tol ±6/channel), all 13 desktop captures.

## Corrections / confirmations vs Part II
- **SURFACE CORRECTED**: dominant page surface is `#FFFFFF` on ALL 13 routes (53.1–86.7% of page), NOT `#F8F8F6`. Part II's #F8F8F6 is superseded by the newer site version this corpus captured. Warm off-white survives as a *secondary tint-band* family: `#F6F6F4` (1.1–11.5% on autzu.com/careers/investors/platform/terms) and `#E8E8E4` as its adjacent border/deeper tint (0.2–1.8%, present on nearly every route). Trace `#FAFAF7` on partnerships (0.48%). [measured]
- **INK CONFIRMED**: `#0B1220` exactly, on all 13 routes, 8.1–41.8% of page (highest: drivers 404 41.8%, contact 32.3% — dark-section-heavy pages). One ink = headline + button fill + dark band + footer confirmed. [measured]
- **COOL TINT FAMILY (new)**: `#E8ECF1` (7.1–8.4% on autzu.com home + hubs) with darker siblings `#E1E6EC`, `#EEF2F6`, `#E6EAF0` — the world-map / hub-section background family. Two tint families coexist: warm (F6F6F4/E8E8E4) and cool (E8ECF1/E1E6EC). [measured]
- **DARK RAISED SURFACE refined**: `#121927` recurs on 9 routes (0.13–0.32%) — cards inside dark bands. Part II's estimate #131B30 → measure ~#121927. Also `#2A3140`, `#333948` = lighter dark-context strokes/rows (privacy/terms hairlines-on-dark? more likely muted dark UI). [measured, small shares]
- **MUTED TEXT candidates**: on white: `#5A6473` and `#6C7582` (0.11–0.2%, drivers/investors/partnerships/platform) — anti-aliased medians, true token likely in the #5A6473–#6C7582 band, darker than Part II's #6E7480–#8A8F99 estimate. On dark: `#A8B0BC`/`#B8BFCA` (1.0–1.5% where dark bands are large). [estimated — AA caveat]
- **HAIRLINES**: warm contexts `#E8E8E4`; cool contexts `#D3D5D9`/`#DEE0E3`/`#C8CACE`. Part II's #E2E6EA estimate sits between the families; treat hairline as per-context (warm/cool) rather than one value. [estimated]
- **ACCENT: none confirmed** — no saturated cluster in any top-14 (≥0.02% floor). Trace green from Part II did not surface at this resolution. Two tones + grays stands. [measured]
- Photography neutrals (`#1C1E1F`, `#101213`, `#C6C7CB` on about/press/blog) are image content, not UI tokens. [inferred]

## Notes for R1 (color agent)
- Sample flat areas directly (sample.py) to pin: tint-band values, dark-card value, footer vs band (both #0B1220?), muted text on white AND on dark, hairline per context. Use 1440 slices; cite coords.
- Verify contrast: #0B1220 on #FFFFFF ≈ 17.9:1; muted candidates: #5A6473 on #FFF ≈ 7.6:1 (passes AA); confirm.

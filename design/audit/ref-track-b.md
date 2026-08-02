# Track B — Live verification of autzu.com

Date: 2026-08-02. Sandboxed container, egress via agent proxy.

## Status

**FAILED — live site unreachable from this container by every available method.** No live CSS, HTML, or font data was obtained. Nothing below upgrades any [estimated] tag to [measured].

| # | Method | Target | Result |
|---|--------|--------|--------|
| 1 | WebFetch | https://autzu.com/ | HTTP 403 Forbidden (body not retrieved) |
| 2 | WebFetch | https://autzu.com/contact | HTTP 403 Forbidden |
| 3 | WebFetch | https://www.autzu.com/ | HTTP 403 Forbidden |
| 4 | WebFetch | https://autzu.com/drivers | HTTP 403 Forbidden |
| 5 | Playwright (chromium, `proxy: { server: process.env.HTTPS_PROXY }`, NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt) | https://autzu.com/ | `net::ERR_TUNNEL_CONNECTION_FAILED` on both goto attempts (proxy refused the CONNECT tunnel) |
| 6 | curl (control, confirms known constraint) | https://autzu.com/ | `curl: (56) CONNECT tunnel failed, response 403` (egress-proxy policy denial) |

Interpretation: the container's egress proxy denies CONNECT to autzu.com:443 (known constraint, confirmed verbatim in row 6). WebFetch, which routes through different infrastructure, also returned 403 on every path tried — consistent with either the same egress policy applying to that infrastructure or origin-side bot blocking (e.g. a WAF/Cloudflare rule rejecting non-browser fetchers). The two cannot be distinguished from inside the sandbox because the 403 response bodies were not retrievable.

Time-box honored: 6 genuine access attempts (4 WebFetch, 1 Playwright run with 2 goto tries, 1 curl control), then stopped per instructions.

## Font identity

UNVERIFIED — live site unreachable. No stylesheet links, font preload URLs, or @font-face rules were obtained. Family names, weights, fallback stacks, source URLs, and licensing (Google Fonts vs. commercial) all unverifiable from this container; no alternates can be responsibly proposed without knowing the real family. [unverified]

## Exact color values

UNVERIFIED — live site unreachable. Specifically NOT confirmed:
- Muted text in the #6E7480 range — exact value unknown; keep the corpus [estimated] tag. [unverified]
- Hairline/border in the #E2E6EA range — exact value unknown; keep [estimated]. [unverified]
- Dark raised-surface colors — [unverified]
- Status/accent colors — [unverified]
- meta theme-color — [unverified]
- CSS custom properties / design tokens (existence and values) — [unverified]

## Motion

UNVERIFIED — live site unreachable. Transition durations, easing functions, and prefers-reduced-motion handling: no CSS text obtained. [unverified]

## Breakpoints

UNVERIFIED — live site unreachable. No @media query values obtained. [unverified]

## Focus / hover states

UNVERIFIED — live site unreachable. No :focus-visible, :hover, or outline declarations obtained. [unverified]

## /drivers page structure

UNVERIFIED — live site unreachable. The screenshot corpus's only artifact for /drivers is a 404 capture; this session could not determine whether the live route exists, what sections it contains, or whether it uses accordion/FAQ rows. WebFetch to https://autzu.com/drivers returned 403 (blocked at proxy/origin, NOT a confirmed 404 from the site itself — do not cite this as evidence the page is missing). [unverified]

## Explicit UNVERIFIED list (for audit tagging)

All of the following stay [estimated]/[unverified] in the audit — none were measured live:

1. Font family names, weights, sources, licensing — UNVERIFIED — live site unreachable
2. Muted text color (#6E7480-range candidate) — UNVERIFIED — live site unreachable
3. Hairline/border color (#E2E6EA-range candidate) — UNVERIFIED — live site unreachable
4. Dark raised-surface colors — UNVERIFIED — live site unreachable
5. Status/accent colors — UNVERIFIED — live site unreachable
6. Design tokens / CSS custom properties — UNVERIFIED — live site unreachable
7. Button/pill border-radius values — UNVERIFIED — live site unreachable
8. Transition durations and easings — UNVERIFIED — live site unreachable
9. prefers-reduced-motion handling — UNVERIFIED — live site unreachable
10. Breakpoint values — UNVERIFIED — live site unreachable
11. Focus-visible and hover styles — UNVERIFIED — live site unreachable
12. meta theme-color — UNVERIFIED — live site unreachable
13. Real /drivers page structure (accordion/FAQ question) — UNVERIFIED — live site unreachable

## Suggested follow-ups (outside this sandbox)

- Ask the egress-proxy operator to allowlist autzu.com:443, or run Track B from an unproxied machine/browser.
- A human with a normal browser can capture the head assets and main stylesheet in under a minute (DevTools > Network > CSS), which would resolve items 1–12; a screenshot of /drivers resolves item 13.

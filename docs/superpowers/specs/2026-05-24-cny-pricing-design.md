# F2: CNY Pricing + Exchange Rate

**Date:** 2026-05-24
**Status:** Draft

---

## Overview

Chinese AI models (DeepSeek, Kimi, GLM, Qwen, MiniMax, Doubao, Hunyuan, ERNIE) have official pricing in CNY. Currently their prices are manually converted to USD in `DEFAULT_PRICE_TABLE`, causing stale exchange rates. This feature adds native CNY pricing support with automatic exchange rate conversion.

**Core principle:** Database always stores USD. Conversion happens at two boundaries: cost calculation (CNY prices → USD for storage) and UI display (USD → CNY for display when user prefers CNY).

---

## 1. Data Model Changes

### PriceEntry (packages/core/src/pricing.ts)

```typescript
export interface PriceEntry {
  input: number
  output: number
  cacheRead?: number
  cacheWrite?: number
  currency?: 'CNY' | 'USD'  // defaults to 'USD' if omitted
}
```

### DEFAULT_PRICE_TABLE

Chinese models change from manually-converted USD to native CNY values with `currency: 'CNY'`. Prices should be copied directly from each provider's official pricing page.

**Affected models:** All models under these provider comments:
- DeepSeek
- Kimi (Moonshot AI)
- GLM (Z.ai / Zhipu AI)
- Qwen (Alibaba Cloud)
- MiniMax
- Doubao (ByteDance)
- Hunyuan (Tencent)
- ERNIE (Baidu)

**Not affected:** Anthropic, OpenAI, Google Gemini, Mistral, xAI Grok, Cohere, Qoder (all USD-priced).

Example:
```typescript
// Before
'deepseek-v4-pro': { input: 1.74, output: 3.48, cacheRead: 0.0145 },
// After (native CNY from official docs)
'deepseek-v4-pro': { input: 12.6, output: 25.2, cacheRead: 0.105, currency: 'CNY' },
```

### Config (packages/cli/src/config.ts)

```typescript
export interface ExchangeRateCache {
  CNY_USD: number       // e.g. 0.137
  fetchedAt: number     // Unix ms timestamp
}

export interface Config {
  // ... existing fields ...
  displayCurrency?: 'USD' | 'CNY'
  exchangeRate?: number                  // manual override (CNY→USD multiplier)
  exchangeRateCache?: ExchangeRateCache  // auto-fetched, persisted
}
```

**Exchange rate priority:** `config.exchangeRate` (manual) > `config.exchangeRateCache.CNY_USD` (auto, <24h) > hardcoded fallback `0.137`.

---

## 2. Exchange Rate Service

New file: `packages/core/src/exchange-rate.ts`

### Constants

- `FALLBACK_RATE = 0.137` — hardcoded CNY→USD fallback
- `CACHE_TTL_MS = 24 * 60 * 60 * 1000` — 24 hours

### Functions

```typescript
/** Fetch CNY→USD rate from free API. Returns null on failure. */
export async function fetchExchangeRate(): Promise<number | null>

/** Resolve effective rate: manual > cached (fresh) > fallback */
export function resolveExchangeRate(config: {
  exchangeRate?: number
  exchangeRateCache?: ExchangeRateCache
}): number

/** Convert CNY amount to USD */
export function convertToUSD(cny: number, rate: number): number

/** Convert USD amount to CNY */
export function convertFromUSD(usd: number, rate: number): number
```

### API Source

Primary: `https://open.er-api.com/v6/latest/CNY` (free, no API key, returns rates for all currencies).

The fetch function extracts `response.rates.USD` and returns it. On any error (network, parse, timeout), returns `null` and the system falls back gracefully.

### Refresh Timing

- On `aiusage serve` startup: call `resolveExchangeRate(config)`. If no cache or cache expired (>24h), attempt `fetchExchangeRate()`. On success, write result to `config.exchangeRateCache` in config.json.
- During runtime: use the resolved rate from startup. No periodic background refresh (rates don't change significantly within a single serve session).

---

## 3. Cost Calculation Changes

### calculateCost (packages/core/src/pricing.ts)

```typescript
export function calculateCost(
  model: string,
  tokens: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheWriteTokens: number
    thinkingTokens: number
  },
  exchangeRate?: number  // NEW optional parameter
): number
```

**Logic change:** After computing raw cost from price table:
- If resolved `PriceEntry` has `currency === 'CNY'`, multiply result by `exchangeRate` (or `FALLBACK_RATE` if not provided) to convert to USD
- If `currency` is `undefined` or `'USD'`, return as-is

**Impact on callers:**
- Parsers (claude-code, codex, openclaw, opencode, hermes, qoder): pass `exchangeRate` from config at parse time
- `POST /api/pricing/recalc`: pass current exchange rate when recalculating

---

## 4. API Changes

### GET /api/config (existing)

Response adds:
```json
{
  "displayCurrency": "USD",
  "exchangeRate": null,
  "exchangeRateCache": { "CNY_USD": 0.137, "fetchedAt": 1716508800000 }
}
```

### PUT /api/config (existing)

Accepts `displayCurrency` and `exchangeRate` fields. Setting `exchangeRate` to `null` or omitting it clears the manual override.

### GET /api/pricing (existing)

Each model entry gains a `currency` field:
```json
{
  "model": "deepseek-v4-pro",
  "price": { "input": 12.6, "output": 25.2, "cacheRead": 0.105 },
  "currency": "CNY",
  "isDefault": true
}
```

USD models have `"currency": "USD"` (or field omitted).

### POST /api/pricing/recalc (existing)

Uses current effective exchange rate for recalculation. No API signature change.

---

## 5. UI Changes

### stores.js

```javascript
export const displayCurrency = writable('USD')
export const exchangeRate = writable(0.137)

export function formatCost(n) {
  // n is always USD from DB
  const curr = get(displayCurrency)
  if (curr === 'CNY') {
    const rate = get(exchangeRate)
    const cny = n / rate
    return cny < 0.01 ? `¥${cny.toFixed(4)}` : `¥${cny.toFixed(2)}`
  }
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
}
```

On app initialization (layout or root component), fetch config and set `displayCurrency` and `exchangeRate` stores.

### Settings Page (packages/web/src/routes/settings/+page.svelte)

Add to General section:
- **Display Currency**: dropdown (USD / CNY)
- **Exchange Rate Override**: number input, placeholder shows current auto-fetched rate. Empty = use auto rate.

Both saved via existing `PUT /api/config`.

### Pricing Page (packages/web/src/routes/pricing/+page.svelte)

- CNY models show prices with `¥` prefix and a "CNY" badge
- Edit modal for CNY models: input fields accept CNY values
- USD models unchanged

### Cost Page, Overview Page, Sessions Page, Projects Page

No template changes needed. `formatCost()` handles conversion automatically since all these pages already use `$formatCost(value)` or `formatCost(value)`.

---

## 6. Files Changed

| File | Change |
|------|--------|
| `packages/core/src/pricing.ts` | Add `currency` to `PriceEntry`, update CNY model prices, modify `calculateCost` |
| `packages/core/src/exchange-rate.ts` | **New file** — exchange rate fetch, resolve, convert |
| `packages/core/src/index.ts` | Re-export exchange-rate module |
| `packages/cli/src/config.ts` | Add `displayCurrency`, `exchangeRate`, `exchangeRateCache` to `Config` |
| `packages/cli/src/api/server.ts` | Pass exchange rate to recalc, expose currency in pricing API |
| `packages/cli/src/commands/serve.ts` | Fetch/cache exchange rate on startup |
| `packages/web/src/lib/stores.js` | Add `displayCurrency`, `exchangeRate` stores; modify `formatCost` |
| `packages/web/src/routes/settings/+page.svelte` | Add currency + rate fields |
| `packages/web/src/routes/pricing/+page.svelte` | Show CNY badge, CNY prices in edit modal |
| `packages/core/tests/pricing.test.ts` | Tests for CNY conversion in calculateCost |
| `packages/core/tests/exchange-rate.test.ts` | **New file** — tests for exchange rate module |

---

## 7. Edge Cases

- **Unknown exchange rate API failure:** Falls back to cached rate, then hardcoded 0.137. Cost calculation never fails.
- **User override of CNY model price:** `PUT /api/pricing` accepts an optional `currency` field. If omitted, the override inherits the default table's currency for that model (CNY for Chinese models). If the model doesn't exist in defaults, currency defaults to USD. Users can explicitly set `currency: 'USD'` to price a Chinese model in USD.
- **Recalc with changed rate:** All CNY model costs get recalculated with the new rate. Records with `costSource: 'log'` are never touched.
- **Mixed currency display:** When `displayCurrency: 'CNY'`, all costs (including USD-priced models) display in CNY. This is intentional — the user wants to see everything in one currency.

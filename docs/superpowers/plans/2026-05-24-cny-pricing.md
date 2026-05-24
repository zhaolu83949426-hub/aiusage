# CNY Pricing + Exchange Rate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native CNY pricing for Chinese AI models with automatic exchange rate conversion, so the database always stores USD but prices can be maintained and displayed in their native currency.

**Architecture:** Add `currency` field to `PriceEntry`, create an exchange rate module in core for fetching/resolving rates, modify `calculateCost` to convert CNY→USD, and update the web UI to support display currency switching via a global store.

**Tech Stack:** TypeScript (core/cli), Svelte 4 (web), Vitest (tests), better-sqlite3 (DB)

---

### Task 1: Add `currency` field to `PriceEntry` and update `calculateCost`

**Files:**
- Modify: `packages/core/src/pricing.ts:1-6` (PriceEntry interface)
- Modify: `packages/core/src/pricing.ts:189-209` (calculateCost function)
- Test: `packages/core/tests/pricing.test.ts`

- [ ] **Step 1: Write failing tests for CNY cost calculation**

Add these tests to `packages/core/tests/pricing.test.ts` inside the `calculateCost` describe block:

```typescript
it('converts CNY model cost to USD using exchangeRate', () => {
  // deepseek-v4-pro has currency: 'CNY' with input: 12.6, output: 25.2
  // 1000 input tokens + 500 output tokens
  // CNY cost: (1000/1M * 12.6) + (500/1M * 25.2) = 0.0126 + 0.0126 = 0.0252 CNY
  // USD cost: 0.0252 * 0.14 = 0.003528
  const cost = calculateCost('deepseek-v4-pro', {
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    thinkingTokens: 0,
  }, 0.14)
  expect(cost).toBeCloseTo(0.003528, 6)
})

it('uses FALLBACK_RATE when no exchangeRate provided for CNY model', () => {
  const cost = calculateCost('deepseek-v4-pro', {
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    thinkingTokens: 0,
  })
  // CNY cost: 0.0252, USD cost: 0.0252 * 0.137 = 0.0034524
  expect(cost).toBeCloseTo(0.0252 * 0.137, 6)
})

it('does not convert USD model even when exchangeRate is provided', () => {
  const cost = calculateCost('claude-sonnet-4-6', {
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    thinkingTokens: 0,
  }, 0.14)
  // Should still be plain USD: (1000/1M * 3) + (500/1M * 15) = 0.0105
  expect(cost).toBeCloseTo(0.0105, 6)
})

it('handles CNY model with cache tokens', () => {
  // deepseek-v4-pro: input: 12.6, output: 25.2, cacheRead: 0.105, currency: 'CNY'
  const cost = calculateCost('deepseek-v4-pro', {
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 2000,
    cacheWriteTokens: 0,
    thinkingTokens: 0,
  }, 0.14)
  // CNY: (1000/1M * 12.6) + (500/1M * 25.2) + (2000/1M * 0.105) = 0.0126 + 0.0126 + 0.00021 = 0.02541
  // USD: 0.02541 * 0.14 = 0.0035574
  expect(cost).toBeCloseTo(0.0035574, 6)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && npx vitest run tests/pricing.test.ts`
Expected: FAIL — tests expect CNY conversion but `calculateCost` doesn't support it yet.

- [ ] **Step 3: Add `currency` to `PriceEntry` interface**

In `packages/core/src/pricing.ts`, change the `PriceEntry` interface:

```typescript
export interface PriceEntry {
  input: number        // per 1M tokens (in currency unit)
  output: number       // per 1M tokens (in currency unit)
  cacheRead?: number   // per 1M tokens (in currency unit)
  cacheWrite?: number  // per 1M tokens (in currency unit)
  currency?: 'CNY' | 'USD'  // defaults to 'USD' if omitted
}
```

- [ ] **Step 4: Update Chinese model prices to native CNY values**

In `packages/core/src/pricing.ts`, update the `DEFAULT_PRICE_TABLE` entries for all Chinese models. Replace the manually-converted USD values with native CNY prices from official docs, and add `currency: 'CNY'`.

DeepSeek (https://api-docs.deepseek.com/quick_start/pricing):
```typescript
'deepseek-v4-pro':       { input: 12.6,   output: 25.2,  cacheRead: 0.105,  currency: 'CNY' },
'deepseek-v4-flash':     { input: 1.0,    output: 2.0,   cacheRead: 0.02,   currency: 'CNY' },
```

Kimi / Moonshot AI (https://platform.kimi.ai/docs/pricing/chat):
```typescript
'kimi-k2.6':             { input: 6.9,    output: 29.0,  cacheRead: 1.15,   currency: 'CNY' },
'kimi-k2.5':             { input: 4.3,    output: 21.6,  cacheRead: 0.72,   currency: 'CNY' },
'kimi-k2-turbo':         { input: 8.3,    output: 57.6,  cacheRead: 1.08,   currency: 'CNY' },
'kimi-k2':               { input: 4.3,    output: 18.0,  cacheRead: 1.08,   currency: 'CNY' },
'moonshot-v1-128k':      { input: 14.4,   output: 36.0,  currency: 'CNY' },
'moonshot-v1-32k':       { input: 7.2,    output: 21.6,  currency: 'CNY' },
'moonshot-v1-8k':        { input: 1.44,   output: 14.4,  currency: 'CNY' },
```

GLM / Z.ai (https://docs.z.ai/guides/overview/pricing):
```typescript
'glm-5.1':               { input: 10.0,   output: 32.0,  currency: 'CNY' },
'glm-5p1':               { input: 10.0,   output: 32.0,  currency: 'CNY' },
'glm-5-turbo':           { input: 8.5,    output: 29.0,  currency: 'CNY' },
'glm-5':                 { input: 7.0,    output: 23.0,  currency: 'CNY' },
'glm-4.7-flashx':        { input: 0.5,    output: 2.8,   currency: 'CNY' },
'glm-4.7':               { input: 4.0,    output: 16.0,  currency: 'CNY' },
'glm-4.6':               { input: 4.0,    output: 16.0,  currency: 'CNY' },
'glm-4.5-x':             { input: 16.0,   output: 64.0,  currency: 'CNY' },
'glm-4.5-airx':          { input: 8.0,    output: 32.0,  currency: 'CNY' },
'glm-4.5-air':           { input: 1.4,    output: 8.0,   currency: 'CNY' },
'glm-4.5':               { input: 4.0,    output: 16.0,  currency: 'CNY' },
```

Qwen / Alibaba (https://www.alibabacloud.com/help/en/model-studio/model-pricing):
```typescript
'qwen3.6-plus':          { input: 2.0,    output: 12.0,  currency: 'CNY' },
'qwen3-235b':            { input: 5.0,    output: 20.0,  currency: 'CNY' },
'qwen3-32b':             { input: 1.12,   output: 4.48,  currency: 'CNY' },
'qwen3-30b':             { input: 1.4,    output: 5.6,   currency: 'CNY' },
'qwen-max':              { input: 11.5,   output: 46.0,  currency: 'CNY' },
'qwen-plus':             { input: 2.8,    output: 8.4,   currency: 'CNY' },
'qwen-turbo':            { input: 0.35,   output: 1.4,   currency: 'CNY' },
'qwen-long':             { input: 0.5,    output: 2.0,   currency: 'CNY' },
'qwen2.5-72b':           { input: 10.0,   output: 40.0,  currency: 'CNY' },
'qwen2.5-7b':            { input: 1.26,   output: 5.04,  currency: 'CNY' },
```

MiniMax (https://platform.minimaxi.com/docs/guides/pricing-paygo):
```typescript
'minimax-m2.7':          { input: 2.1,    output: 8.4,   cacheRead: 0.42,   cacheWrite: 2.6, currency: 'CNY' },
'minimax-m2.5':          { input: 2.1,    output: 8.4,   cacheRead: 0.21,   cacheWrite: 2.6, currency: 'CNY' },
```

Doubao / ByteDance (https://www.volcengine.com/docs/82379/1544106):
```typescript
'doubao-seed-2.0-pro':   { input: 3.7,    output: 18.5,  currency: 'CNY' },
'doubao-seed-2.0-code':  { input: 3.36,   output: 16.8,  currency: 'CNY' },
'doubao-seed-2.0-lite':  { input: 0.63,   output: 3.78,  currency: 'CNY' },
'doubao-seed-2.0-mini':  { input: 0.21,   output: 2.1,   currency: 'CNY' },
'doubao-seed-1.6-flash': { input: 0.16,   output: 1.58,  currency: 'CNY' },
'doubao-seed-1.6-lite':  { input: 0.32,   output: 2.52,  currency: 'CNY' },
'doubao-seed-1.6':       { input: 0.84,   output: 8.4,   currency: 'CNY' },
'doubao-1.5-pro':        { input: 0.84,   output: 2.1,   currency: 'CNY' },
'doubao-1.5-lite':       { input: 0.32,   output: 0.63,  currency: 'CNY' },
```

Hunyuan / Tencent (https://cloud.tencent.com/document/product/1729):
```typescript
'hunyuan-t1':            { input: 0.48,   output: 1.87,  cacheRead: 0.21, currency: 'CNY' },
'hunyuan-a13b':          { input: 1.0,    output: 4.1,   currency: 'CNY' },
```

ERNIE / Baidu (https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Blfmc9dlf):
```typescript
'ernie-4.5-300b':        { input: 2.0,    output: 6.5,   currency: 'CNY' },
'ernie-4.5-21b':         { input: 0.5,    output: 2.0,   currency: 'CNY' },
'ernie-x1':              { input: 2.0,    output: 8.0,   currency: 'CNY' },
```

**Important:** The exact CNY values above are estimates based on reverse-converting the current USD values at ~7.2 CNY/USD. The implementor MUST verify each price against the official pricing page URL in the comment above each section. If the official page is inaccessible, use the reverse-converted values and add a `// TODO: verify against official pricing` comment.

- [ ] **Step 5: Add `FALLBACK_RATE` constant and update `calculateCost`**

In `packages/core/src/pricing.ts`, add a constant before `calculateCost` and update the function:

```typescript
export const FALLBACK_RATE = 0.137  // CNY → USD

export function calculateCost(
  model: string,
  tokens: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheWriteTokens: number
    thinkingTokens: number
  },
  exchangeRate?: number
): number {
  const price = resolvePrice(model)
  if (!price) return 0

  const inputCost = (tokens.inputTokens / 1_000_000) * price.input
  const outputCost = (tokens.outputTokens / 1_000_000) * price.output
  const cacheReadCost = (tokens.cacheReadTokens / 1_000_000) * (price.cacheRead ?? 0)
  const cacheWriteCost = (tokens.cacheWriteTokens / 1_000_000) * (price.cacheWrite ?? 0)
  const thinkingCost = (tokens.thinkingTokens / 1_000_000) * price.output

  const rawCost = inputCost + outputCost + cacheReadCost + cacheWriteCost + thinkingCost

  if (price.currency === 'CNY') {
    return rawCost * (exchangeRate ?? FALLBACK_RATE)
  }
  return rawCost
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd packages/core && npx vitest run tests/pricing.test.ts`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/pricing.ts packages/core/tests/pricing.test.ts
git commit -m "feat: add currency field to PriceEntry and CNY conversion in calculateCost"
```

---

### Task 2: Create exchange rate module

**Files:**
- Create: `packages/core/src/exchange-rate.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/tests/exchange-rate.test.ts`

- [ ] **Step 1: Write failing tests for exchange rate module**

Create `packages/core/tests/exchange-rate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { resolveExchangeRate, convertToUSD, convertFromUSD, FALLBACK_RATE, CACHE_TTL_MS } from '../src/exchange-rate.js'

describe('resolveExchangeRate', () => {
  it('returns manual override when set', () => {
    const rate = resolveExchangeRate({
      exchangeRate: 0.14,
      exchangeRateCache: { CNY_USD: 0.138, fetchedAt: Date.now() },
    })
    expect(rate).toBe(0.14)
  })

  it('returns cached rate when fresh', () => {
    const rate = resolveExchangeRate({
      exchangeRateCache: { CNY_USD: 0.138, fetchedAt: Date.now() - 1000 },
    })
    expect(rate).toBe(0.138)
  })

  it('returns fallback when cache expired', () => {
    const rate = resolveExchangeRate({
      exchangeRateCache: { CNY_USD: 0.138, fetchedAt: Date.now() - CACHE_TTL_MS - 1 },
    })
    expect(rate).toBe(FALLBACK_RATE)
  })

  it('returns fallback when no config', () => {
    const rate = resolveExchangeRate({})
    expect(rate).toBe(FALLBACK_RATE)
  })

  it('prefers manual override over expired cache', () => {
    const rate = resolveExchangeRate({
      exchangeRate: 0.15,
      exchangeRateCache: { CNY_USD: 0.138, fetchedAt: Date.now() - CACHE_TTL_MS - 1 },
    })
    expect(rate).toBe(0.15)
  })
})

describe('convertToUSD', () => {
  it('converts CNY to USD', () => {
    expect(convertToUSD(100, 0.14)).toBeCloseTo(14, 6)
  })
})

describe('convertFromUSD', () => {
  it('converts USD to CNY', () => {
    expect(convertFromUSD(14, 0.14)).toBeCloseTo(100, 6)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && npx vitest run tests/exchange-rate.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Create `packages/core/src/exchange-rate.ts`**

```typescript
export const FALLBACK_RATE = 0.137  // CNY → USD
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24 hours

export interface ExchangeRateCache {
  CNY_USD: number
  fetchedAt: number
}

export function resolveExchangeRate(config: {
  exchangeRate?: number
  exchangeRateCache?: ExchangeRateCache
}): number {
  if (config.exchangeRate != null) return config.exchangeRate

  if (config.exchangeRateCache) {
    const age = Date.now() - config.exchangeRateCache.fetchedAt
    if (age < CACHE_TTL_MS) return config.exchangeRateCache.CNY_USD
  }

  return FALLBACK_RATE
}

export async function fetchExchangeRate(): Promise<number | null> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/CNY', {
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return null
    const data = await response.json()
    const rate = data?.rates?.USD
    if (typeof rate !== 'number' || rate <= 0) return null
    return rate
  } catch {
    return null
  }
}

export function convertToUSD(cny: number, rate: number): number {
  return cny * rate
}

export function convertFromUSD(usd: number, rate: number): number {
  return usd / rate
}
```

- [ ] **Step 4: Add re-export in `packages/core/src/index.ts`**

Add this line at the end of `packages/core/src/index.ts`:

```typescript
export * from './exchange-rate.js'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/core && npx vitest run tests/exchange-rate.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Remove duplicate `FALLBACK_RATE` from `pricing.ts`**

In Task 1 we added `FALLBACK_RATE` to `pricing.ts`. Now that the canonical location is `exchange-rate.ts`, update `pricing.ts` to import it instead:

In `packages/core/src/pricing.ts`, remove the `export const FALLBACK_RATE = 0.137` line and add at the top:

```typescript
import { FALLBACK_RATE } from './exchange-rate.js'
```

- [ ] **Step 7: Run all core tests to verify nothing broke**

Run: `cd packages/core && npx vitest run`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/exchange-rate.ts packages/core/src/index.ts packages/core/src/pricing.ts packages/core/tests/exchange-rate.test.ts
git commit -m "feat: add exchange rate module with fetch, resolve, and convert"
```

---

### Task 3: Update `Config` type and add exchange rate to server startup

**Files:**
- Modify: `packages/cli/src/config.ts:41-54` (Config interface)
- Modify: `packages/cli/src/commands/serve.ts:36-43` (serve function startup)

- [ ] **Step 1: Add new fields to `Config` interface**

In `packages/cli/src/config.ts`, add the import and update the interface:

Add import at top:
```typescript
import type { ExchangeRateCache } from '@aiusage/core'
```

Add fields to the `Config` interface after `weekStart`:
```typescript
  /** Display currency for the web UI: 'USD' (default) or 'CNY' */
  displayCurrency?: 'USD' | 'CNY'
  /** Manual exchange rate override (CNY → USD multiplier) */
  exchangeRate?: number
  /** Auto-fetched exchange rate cache */
  exchangeRateCache?: ExchangeRateCache
```

- [ ] **Step 2: Add exchange rate initialization to `serve.ts`**

In `packages/cli/src/commands/serve.ts`, add the import:

```typescript
import { resolveExchangeRate, fetchExchangeRate, CACHE_TTL_MS } from '@aiusage/core'
import { saveConfig } from '../config.js'
```

Note: `loadConfig` is already imported, and `saveConfig` needs to be added to the existing import.

After the price overrides restoration block (after line 43), add exchange rate initialization:

```typescript
  // Initialize exchange rate (fetch if cache missing or expired)
  const exchangeRateConfig = config ?? {}
  let needsFetch = true
  if (exchangeRateConfig.exchangeRate != null) {
    needsFetch = false  // manual override, no fetch needed
  } else if (exchangeRateConfig.exchangeRateCache) {
    const age = Date.now() - exchangeRateConfig.exchangeRateCache.fetchedAt
    needsFetch = age >= CACHE_TTL_MS
  }
  if (needsFetch) {
    fetchExchangeRate().then(rate => {
      if (rate != null) {
        const cfg = loadConfig() ?? {}
        cfg.exchangeRateCache = { CNY_USD: rate, fetchedAt: Date.now() }
        saveConfig(cfg)
      }
    }).catch(() => {
      // Silently ignore — fallback rate will be used
    })
  }
```

- [ ] **Step 3: Verify the CLI builds**

Run: `cd packages/cli && npx tsup`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/config.ts packages/cli/src/commands/serve.ts
git commit -m "feat: add exchange rate config fields and auto-fetch on serve startup"
```

---

### Task 4: Pass exchange rate to parsers and recalc

**Files:**
- Modify: `packages/core/src/parsers/claude-code.ts:36`
- Modify: `packages/core/src/parsers/codex.ts:69`
- Modify: `packages/core/src/parsers/openclaw.ts:47`
- Modify: `packages/core/src/parsers/qoder.ts:75`
- Modify: `packages/core/src/types.ts:83` (ParseContext)
- Modify: `packages/cli/src/commands/parse-opencode.ts:120`
- Modify: `packages/cli/src/commands/parse-hermes.ts:108`
- Modify: `packages/cli/src/commands/parse-qoder.ts:93`
- Modify: `packages/cli/src/api/server.ts:730` (recalc)
- Modify: `packages/cli/src/commands/recalc.ts:34`
- Modify: `packages/cli/src/commands/parse.ts` (where contexts are created)

- [ ] **Step 1: Add `exchangeRate` to `ParseContext`**

In `packages/core/src/types.ts`, add to the `ParseContext` interface:

```typescript
  exchangeRate?: number               // CNY→USD rate for cost calculation
```

- [ ] **Step 2: Update core parsers to pass `exchangeRate` to `calculateCost`**

In each core parser, add `context.exchangeRate` as the third argument to `calculateCost`:

**`packages/core/src/parsers/claude-code.ts`** — find the `calculateCost(model, {` call and add the third arg:
```typescript
    const cost = model === 'unknown' ? 0 : calculateCost(model, {
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      thinkingTokens,
    }, context.exchangeRate)
```

**`packages/core/src/parsers/codex.ts`** — same pattern:
```typescript
    const cost = model === 'unknown' ? 0 : calculateCost(model, {
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      thinkingTokens,
    }, context.exchangeRate)
```

**`packages/core/src/parsers/openclaw.ts`** — find the `calculateCost` call (line ~47):
```typescript
      cost = calculateCost(model, {
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheWriteTokens,
        thinkingTokens,
      }, context.exchangeRate)
```

**`packages/core/src/parsers/qoder.ts`** — find the `calculateCost` call (line ~75):
```typescript
    const cost = hasPrice ? calculateCost(model, {
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      thinkingTokens,
    }, context.exchangeRate) : 0
```

- [ ] **Step 3: Update CLI parsers to pass `exchangeRate` to `calculateCost`**

In each CLI-side parser, add the exchange rate as the third argument. These parsers call `calculateCost` directly (not via ParseContext).

**`packages/cli/src/commands/parse-opencode.ts`** — at line ~120:
```typescript
    const calculatedCost = model !== 'unknown' ? calculateCost(model, tokenArgs, exchangeRate) : 0
```

The `exchangeRate` variable needs to be resolved from config at the top of the parse function. Find where `loadConfig()` is called in this file and add:
```typescript
import { resolveExchangeRate } from '@aiusage/core'
// ... after loadConfig()
const exchangeRate = resolveExchangeRate(config ?? {})
```

**`packages/cli/src/commands/parse-hermes.ts`** — at line ~108:
```typescript
      cost = calculateCost(model, tokenArgs, exchangeRate)
```

Same pattern: resolve exchangeRate from config at the top.

**`packages/cli/src/commands/parse-qoder.ts`** — at line ~93:
```typescript
    const calculatedCost = calculateCost(model, tokenArgs, exchangeRate)
```

Same pattern: resolve exchangeRate from config at the top.

- [ ] **Step 4: Update `parse.ts` to pass `exchangeRate` in ParseContext**

In `packages/cli/src/commands/parse.ts`, find where `ParseContext` objects are created (likely via `aggregator.createContext()`). Before that, resolve the exchange rate:

```typescript
import { resolveExchangeRate } from '@aiusage/core'
// ... in the parse function, after loading config
const exchangeRate = resolveExchangeRate(config ?? {})
```

Then when creating contexts, include `exchangeRate` in the options (it will flow through to `ParseContext`).

Update `packages/core/src/aggregator.ts` `createContext` to pass through `exchangeRate`:

```typescript
export interface CreateContextOptions {
  tool: Tool
  sourceFile: string
  lineOffset: number
  sessionId: string
  device: string
  deviceInstanceId: string
  platform?: string
  exchangeRate?: number
}
```

And in `createContext`:
```typescript
  createContext(options: CreateContextOptions): ParseContext {
    return {
      ...options,
      now: Date.now(),
    }
  }
```

The spread already handles it, no code change needed in `createContext` body — just the interface.

- [ ] **Step 5: Update recalc in `server.ts`**

In `packages/cli/src/api/server.ts`, at the `/api/pricing/recalc` handler (line ~712), resolve the exchange rate and pass it to `calculateCost`:

Add import at top:
```typescript
import { resolveExchangeRate } from '@aiusage/core'
```

Note: This module already imports from `@aiusage/core` — just add `resolveExchangeRate` to the existing import.

Inside the recalc handler, before the while loop:
```typescript
        const exchangeRate = resolveExchangeRate(loadConfig() ?? {})
```

Then update the `calculateCost` call (line ~730):
```typescript
              const cost = hasPrice ? calculateCost(model, {
                inputTokens: r.input_tokens,
                outputTokens: r.output_tokens,
                cacheReadTokens: r.cache_read_tokens,
                cacheWriteTokens: r.cache_write_tokens,
                thinkingTokens: r.thinking_tokens,
              }, exchangeRate) : 0
```

- [ ] **Step 6: Update standalone `recalc.ts` command**

In `packages/cli/src/commands/recalc.ts`, apply the same pattern:

Add `resolveExchangeRate` to the `@aiusage/core` import, resolve the rate from config, and pass it to `calculateCost`.

- [ ] **Step 7: Verify CLI builds**

Run: `cd packages/cli && npx tsup`
Expected: Build succeeds.

- [ ] **Step 8: Run core tests to verify nothing broke**

Run: `cd packages/core && npx vitest run`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/aggregator.ts packages/core/src/parsers/ packages/cli/src/commands/ packages/cli/src/api/server.ts
git commit -m "feat: pass exchange rate through parsers and recalc for CNY conversion"
```

---

### Task 5: Update pricing API to include `currency` field

**Files:**
- Modify: `packages/cli/src/api/server.ts:625-708` (GET/PUT /api/pricing)

- [ ] **Step 1: Update GET /api/pricing to include `currency`**

In `packages/cli/src/api/server.ts`, in the GET handler for `/api/pricing` (line ~655), update the return object to include currency:

```typescript
            return {
              model,
              price: resolvedPrice ?? null,
              currency: resolvedPrice?.currency ?? 'USD',
              isDefault,
              isOverride,
              matchedBy,
            }
```

- [ ] **Step 2: Update PUT /api/pricing to accept `currency`**

In the PUT handler (line ~676), update the entry construction:

```typescript
            const entry: PriceEntry = {
              input: data.input,
              output: data.output,
              cacheRead: data.cacheRead,
              cacheWrite: data.cacheWrite,
            }
            if (data.currency === 'CNY') {
              entry.currency = 'CNY'
            }
```

Note: The existing code has a `thinking` field that doesn't match `PriceEntry` — this is a pre-existing issue; don't introduce it in the new code.

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/api/server.ts
git commit -m "feat: include currency field in pricing API responses and accept it in overrides"
```

---

### Task 6: Update config API to expose exchange rate and display currency

**Files:**
- Modify: `packages/cli/src/api/server.ts:878-991` (/api/config GET and PUT)

- [ ] **Step 1: Update GET /api/config response**

In the GET handler (line ~884), add the new fields to the response object:

```typescript
          json(res, {
            device: rest.device ?? null,
            weekStart: rest.weekStart ?? 1,
            dashboardPollInterval: rest.dashboardPollInterval ?? null,
            parseInterval: rest.parseInterval ?? null,
            retentionDays: rest.retentionDays ?? null,
            displayCurrency: rest.displayCurrency ?? 'USD',
            exchangeRate: rest.exchangeRate ?? null,
            exchangeRateCache: rest.exchangeRateCache ?? null,
            sources: {
              // ... existing sources unchanged ...
            },
            sync: rest.sync ?? null,
            credentialKeys: credentials ? Object.keys(credentials) : [],
            hostname: hostname(),
            platform: osPlatform,
            defaultPaths: getDefaultSourcePaths(),
          })
```

- [ ] **Step 2: Update PUT /api/config to handle new fields**

In the PUT handler, add handling for the new fields after the existing `weekStart` block (after line ~927):

```typescript
            if ('displayCurrency' in update) {
              const dc = update.displayCurrency
              if (dc === 'USD' || dc === 'CNY') {
                existing.displayCurrency = dc
              } else {
                delete existing.displayCurrency
              }
            }
            if ('exchangeRate' in update) {
              const er = update.exchangeRate
              if (er != null && typeof er === 'number' && er > 0) {
                existing.exchangeRate = er
              } else {
                delete existing.exchangeRate
              }
            }
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/api/server.ts
git commit -m "feat: expose displayCurrency and exchangeRate in config API"
```

---

### Task 7: Update web UI stores and `formatCost` for currency switching

**Files:**
- Modify: `packages/web/src/lib/stores.js`
- Modify: `packages/web/src/routes/+layout.svelte`

- [ ] **Step 1: Add currency stores and update `formatCost`**

In `packages/web/src/lib/stores.js`, add the import and new stores:

```javascript
import { writable, get } from 'svelte/store'

// ... existing stores unchanged ...

export const displayCurrency = writable('USD')
export const exchangeRate = writable(0.137)

export function formatCost(n) {
  const curr = get(displayCurrency)
  if (curr === 'CNY') {
    const rate = get(exchangeRate)
    const cny = n / rate
    return cny < 0.01 ? `¥${cny.toFixed(4)}` : `¥${cny.toFixed(2)}`
  }
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
}
```

Note: The existing `import { writable } from 'svelte/store'` needs `get` added.

- [ ] **Step 2: Initialize currency stores from config in layout**

In `packages/web/src/routes/+layout.svelte`, add the import and initialization:

```svelte
<script>
  import { displayCurrency, exchangeRate } from '$lib/stores.js'
  import { fetchConfig } from '$lib/api.js'
  // ... existing imports ...

  onMount(() => {
    initTheme()
    loadSyncStatus()
    // Initialize currency stores from config
    fetchConfig().then(cfg => {
      if (cfg.displayCurrency) displayCurrency.set(cfg.displayCurrency)
      if (cfg.exchangeRateCache?.CNY_USD) exchangeRate.set(cfg.exchangeRateCache.CNY_USD)
      if (cfg.exchangeRate) exchangeRate.set(cfg.exchangeRate)  // manual override takes precedence
    }).catch(() => {})
    // ... existing localStorage check ...
  })
</script>
```

Note: `fetchConfig` is not currently imported in layout — add it. `onMount` is already imported.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/lib/stores.js packages/web/src/routes/+layout.svelte
git commit -m "feat: add displayCurrency and exchangeRate stores with formatCost conversion"
```

---

### Task 8: Add currency settings to Settings page

**Files:**
- Modify: `packages/web/src/routes/settings/+page.svelte`

- [ ] **Step 1: Add currency form state**

In `packages/web/src/routes/settings/+page.svelte`, in the `<script>` block, add form state:

```javascript
  let currency = { displayCurrency: 'USD', exchangeRate: '' }
  let currencySaving = false; let currencyError = ''; let currencySaved = false
```

- [ ] **Step 2: Load currency settings from config**

In the `onMount` / data loading section where `fetchConfig()` is called, populate the currency form:

```javascript
    currency.displayCurrency = data.displayCurrency || 'USD'
    currency.exchangeRate = data.exchangeRate != null ? String(data.exchangeRate) : ''
```

Also store the cached rate for display in the placeholder:

```javascript
    let cachedRate = data.exchangeRateCache?.CNY_USD ?? 0.137
```

- [ ] **Step 3: Add save handler**

```javascript
  async function saveCurrency() {
    currencySaving = true; currencyError = ''; currencySaved = false
    try {
      await saveConfig({
        displayCurrency: currency.displayCurrency,
        exchangeRate: currency.exchangeRate ? Number(currency.exchangeRate) : null,
      })
      // Update global stores immediately
      displayCurrency.set(currency.displayCurrency)
      if (currency.exchangeRate) {
        exchangeRate.set(Number(currency.exchangeRate))
      }
      currencySaved = true
      setTimeout(() => { currencySaved = false }, 2000)
    } catch (e) {
      currencyError = e instanceof Error ? e.message : 'Failed to save'
    } finally {
      currencySaving = false
    }
  }
```

Add import for `displayCurrency` and `exchangeRate` from `$lib/stores.js`.

- [ ] **Step 4: Add currency settings UI**

Add a new section in the template, after the General section:

```svelte
<div class="card settings-card">
  <h2 class="section-title">{$t('settings.currency') ?? 'Currency'}</h2>
  <div class="field-group">
    <div class="field">
      <label for="displayCurrency">{$t('settings.displayCurrency') ?? 'Display Currency'}</label>
      <select id="displayCurrency" bind:value={currency.displayCurrency}>
        <option value="USD">USD ($)</option>
        <option value="CNY">CNY (¥)</option>
      </select>
    </div>
    <div class="field">
      <label for="exchangeRate">{$t('settings.exchangeRate') ?? 'Exchange Rate Override (CNY → USD)'}</label>
      <input
        id="exchangeRate"
        type="number"
        step="0.001"
        min="0"
        placeholder={`Auto: ${cachedRate}`}
        bind:value={currency.exchangeRate}
      />
      <span class="field-hint">{$t('settings.exchangeRateHint') ?? 'Leave empty to use auto-fetched rate'}</span>
    </div>
  </div>
  <div class="actions">
    <button class="btn-primary" on:click={saveCurrency} disabled={currencySaving}>
      {currencySaving ? $t('settings.saving') : $t('settings.save')}
    </button>
    {#if currencySaved}<span class="save-ok">{$t('settings.saved')}</span>{/if}
    {#if currencyError}<span class="save-err">{currencyError}</span>{/if}
  </div>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/routes/settings/+page.svelte
git commit -m "feat: add currency display and exchange rate settings to Settings page"
```

---

### Task 9: Update Pricing page for CNY badge and currency display

**Files:**
- Modify: `packages/web/src/routes/pricing/+page.svelte`

- [ ] **Step 1: Read the pricing page to understand current structure**

Read `packages/web/src/routes/pricing/+page.svelte` fully before making changes.

- [ ] **Step 2: Add CNY badge to model list**

In the model list rendering, add a CNY badge next to models that have `currency === 'CNY'`:

```svelte
{#if m.currency === 'CNY'}
  <span class="badge badge-cny">CNY</span>
{/if}
```

Add CSS for the badge:
```css
.badge-cny {
  background: var(--purple-dim);
  color: var(--purple);
}
```

- [ ] **Step 3: Show currency symbol in price display**

When displaying prices in the model list, prefix with the correct symbol:

```svelte
{m.currency === 'CNY' ? '¥' : '$'}{m.price?.input ?? '—'}
```

Apply this pattern to all price columns (input, output, cacheRead, cacheWrite).

- [ ] **Step 4: Update edit modal for currency awareness**

In the price edit modal, show the currency context:

```svelte
<span class="edit-currency">{editModel?.currency === 'CNY' ? 'CNY (¥)' : 'USD ($)'} per 1M tokens</span>
```

The edit modal should accept values in the model's native currency — the server stores them in native currency in the price table.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/routes/pricing/+page.svelte
git commit -m "feat: show CNY badge and currency symbols on Pricing page"
```

---

### Task 10: Add i18n keys for new UI strings

**Files:**
- Modify: `packages/web/src/lib/i18n.js` (or wherever i18n translations live)

- [ ] **Step 1: Find the i18n file**

Search for the i18n translations file:
```bash
grep -r "settings.save" packages/web/src/lib/
```

- [ ] **Step 2: Add translation keys**

Add these keys to both en and zh translations:

English:
```javascript
'settings.currency': 'Currency',
'settings.displayCurrency': 'Display Currency',
'settings.exchangeRate': 'Exchange Rate Override (CNY → USD)',
'settings.exchangeRateHint': 'Leave empty to use auto-fetched rate',
```

Chinese:
```javascript
'settings.currency': '货币',
'settings.displayCurrency': '显示货币',
'settings.exchangeRate': '汇率覆盖（CNY → USD）',
'settings.exchangeRateHint': '留空使用自动获取的汇率',
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/lib/i18n.js
git commit -m "feat: add i18n keys for currency settings"
```

---

### Task 11: Final integration test and build verification

- [ ] **Step 1: Run all core tests**

Run: `cd packages/core && npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Build core**

Run: `cd packages/core && npx tsup`
Expected: Build succeeds.

- [ ] **Step 3: Build CLI**

Run: `cd packages/cli && npx tsup`
Expected: Build succeeds.

- [ ] **Step 4: Build web**

Run: `cd packages/web && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Smoke test**

Start the server and verify:
1. `GET /api/pricing` returns `currency` field for Chinese models
2. `GET /api/config` returns `displayCurrency` and `exchangeRateCache`
3. Pricing page shows CNY badges
4. Settings page shows currency dropdown and exchange rate field
5. Changing display currency to CNY updates all cost displays to ¥

- [ ] **Step 6: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: integration fixups for CNY pricing"
```

# Tool Calls & Skill Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract specific Claude Code skill names into tool call stats, and annotate the Tool Calls page when Qoder/Cursor are selected (their data sources don't contain tool call records).

**Architecture:** Three independent changes — (1) parser extracts `skill__<name>` from Skill tool_use blocks, (2) server.ts classification/filter logic recognises the new prefix, (3) web page shows an info notice when a tool with no tool-call data is selected.

**Tech Stack:** TypeScript, Node.js, better-sqlite3, SvelteKit, Vitest

---

## File Map

| File | What changes |
|---|---|
| `packages/core/src/parsers/claude-code.ts` | Store `skill__<name>` instead of `Skill` |
| `packages/core/tests/claude-code.test.ts` | New tests for Skill extraction |
| `packages/cli/src/api/server.ts` | `classifyToolCall`, `getToolTypeFilter`, display name |
| `packages/cli/tests/api/tool-classification.test.ts` | New tests for `skill__` prefix |
| `packages/web/src/lib/i18n.js` | Add `noToolCallData` key to both `en` and `zh` |
| `packages/web/src/routes/tool-calls/+page.svelte` | Info notice for Qoder/Cursor |

---

### Task 1: Claude Code parser — extract specific skill names

**Files:**
- Modify: `packages/core/src/parsers/claude-code.ts:71-90`
- Test: `packages/core/tests/claude-code.test.ts`

- [ ] **Step 1: Write failing tests for Skill extraction**

Add these two `it` blocks at the end of the `describe('ClaudeCodeParser', ...)` block in `packages/core/tests/claude-code.test.ts`:

```typescript
  it('extracts specific skill name as skill__<name> for Skill tool_use', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tu_skill', name: 'Skill', input: { skill: 'superpowers:brainstorming' } },
        ],
        model: 'claude-sonnet-4-6',
        usage: { input_tokens: 10, output_tokens: 5 },
      },
      timestamp: 1776738085700,
    })
    const result = parser.parseLine(line, { ...baseContext, lineOffset: 9999 })
    expect(result).not.toBeNull()
    expect(result!.toolCalls).toHaveLength(1)
    expect(result!.toolCalls[0].name).toBe('skill__superpowers:brainstorming')
    expect(result!.toolCalls[0].callIndex).toBe(0)
  })

  it('extracts skill__unknown when Skill tool_use has no skill argument', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'tu_skill2', name: 'Skill', input: {} },
        ],
        model: 'claude-sonnet-4-6',
        usage: { input_tokens: 10, output_tokens: 5 },
      },
      timestamp: 1776738085700,
    })
    const result = parser.parseLine(line, { ...baseContext, lineOffset: 9998 })
    expect(result).not.toBeNull()
    expect(result!.toolCalls).toHaveLength(1)
    expect(result!.toolCalls[0].name).toBe('skill__unknown')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm --filter @aiusage/core test -- --reporter=verbose 2>&1 | grep -E "PASS|FAIL|skill"
```

Expected: two new tests FAIL because the parser still stores `"Skill"`.

- [ ] **Step 3: Implement the fix in `packages/core/src/parsers/claude-code.ts`**

Replace the `tool_use` extraction block (currently lines 74–88). The full replacement for the inner loop body is:

```typescript
      for (const block of parsed.message.content) {
        if (block.type === 'tool_use') {
          let storedName: string
          if (block.name === 'Skill') {
            const skillArg = typeof block.input?.skill === 'string' ? block.input.skill.trim() : ''
            storedName = skillArg ? `skill__${skillArg}` : 'skill__unknown'
          } else {
            // Clean malformed names (some logs have args/quotes embedded in name)
            const rawName: string = block.name ?? ''
            const cleanName = rawName.replace(/[=:"'{\[\s].*$/s, '').replace(/[^a-zA-Z0-9_-]/g, '')
            if (!cleanName) { callIndex++; continue }
            storedName = cleanName
          }
          toolCalls.push({
            id: generateToolCallId(record.id, storedName, ts, callIndex),
            recordId: record.id,
            name: storedName,
            ts,
            callIndex,
          })
          callIndex++
        }
      }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm --filter @aiusage/core test -- --reporter=verbose 2>&1 | grep -E "PASS|FAIL|skill|✓|✗"
```

Expected: all tests pass including the two new ones.

- [ ] **Step 5: Commit**

```bash
cd /Users/tjh/WebstormProjects/aiusage
git add packages/core/src/parsers/claude-code.ts packages/core/tests/claude-code.test.ts
git commit -m "feat: extract specific skill names from Claude Code Skill tool_use blocks"
```

---

### Task 2: Server — update classification, filter, and display for `skill__` prefix

**Files:**
- Modify: `packages/cli/src/api/server.ts:79-101` and the `toolCalls` response mapping at ~line 564
- Test: `packages/cli/tests/api/tool-classification.test.ts`

- [ ] **Step 1: Write failing tests**

In `packages/cli/tests/api/tool-classification.test.ts`, update/add these test cases:

Replace the existing `describe('classifyToolCall', ...)` and `describe('getToolTypeFilter', ...)` blocks entirely with:

```typescript
import { describe, it, expect } from 'vitest'

function classifyToolCall(name: string): 'mcp' | 'skill' | 'builtin' {
  if (name.startsWith('mcp__')) return 'mcp'
  if (name.startsWith('skill__') || name === 'Skill') return 'skill'
  return 'builtin'
}

function parseMcpName(name: string): { server: string; action: string; display: string } {
  const withoutPrefix = name.slice(5) // remove 'mcp__'
  const idx = withoutPrefix.indexOf('__')
  if (idx === -1) return { server: withoutPrefix, action: '', display: withoutPrefix }
  return {
    server: withoutPrefix.slice(0, idx),
    action: withoutPrefix.slice(idx + 2),
    display: `${withoutPrefix.slice(0, idx)} / ${withoutPrefix.slice(idx + 2)}`,
  }
}

function getSkillDisplayName(name: string): string {
  if (name.startsWith('skill__')) return name.slice('skill__'.length)
  return name
}

function getToolTypeFilter(toolType: string | null): string {
  if (toolType === 'mcp') return "AND tc.name LIKE 'mcp__%'"
  if (toolType === 'skill') return "AND (tc.name LIKE 'skill__%' OR tc.name = 'Skill')"
  if (toolType === 'builtin') return "AND tc.name NOT LIKE 'mcp__%' AND tc.name NOT LIKE 'skill__%' AND tc.name != 'Skill'"
  return ''
}

describe('classifyToolCall', () => {
  it('classifies mcp__ prefix as mcp', () => {
    expect(classifyToolCall('mcp__brave__search')).toBe('mcp')
    expect(classifyToolCall('mcp__filesystem__read_file')).toBe('mcp')
  })

  it('classifies skill__ prefix as skill', () => {
    expect(classifyToolCall('skill__superpowers:brainstorming')).toBe('skill')
    expect(classifyToolCall('skill__unknown')).toBe('skill')
  })

  it('classifies legacy exact "Skill" as skill (backward compat)', () => {
    expect(classifyToolCall('Skill')).toBe('skill')
  })

  it('classifies SkillXYZ as builtin (not skill)', () => {
    expect(classifyToolCall('SkillX')).toBe('builtin')
  })

  it('classifies common tools as builtin', () => {
    expect(classifyToolCall('Read')).toBe('builtin')
    expect(classifyToolCall('Bash')).toBe('builtin')
    expect(classifyToolCall('Edit')).toBe('builtin')
  })
})

describe('parseMcpName', () => {
  it('parses standard mcp__server__action', () => {
    const result = parseMcpName('mcp__brave__search')
    expect(result.server).toBe('brave')
    expect(result.action).toBe('search')
    expect(result.display).toBe('brave / search')
  })

  it('handles complex action names', () => {
    const result = parseMcpName('mcp__filesystem__read_file')
    expect(result.server).toBe('filesystem')
    expect(result.action).toBe('read_file')
    expect(result.display).toBe('filesystem / read_file')
  })

  it('handles missing second double underscore', () => {
    const result = parseMcpName('mcp__bareserver')
    expect(result.server).toBe('bareserver')
    expect(result.action).toBe('')
    expect(result.display).toBe('bareserver')
  })
})

describe('getSkillDisplayName', () => {
  it('strips skill__ prefix', () => {
    expect(getSkillDisplayName('skill__superpowers:brainstorming')).toBe('superpowers:brainstorming')
    expect(getSkillDisplayName('skill__unknown')).toBe('unknown')
  })

  it('returns legacy Skill name unchanged', () => {
    expect(getSkillDisplayName('Skill')).toBe('Skill')
  })
})

describe('getToolTypeFilter', () => {
  it('returns mcp filter for mcp type', () => {
    expect(getToolTypeFilter('mcp')).toBe("AND tc.name LIKE 'mcp__%'")
  })

  it('returns skill filter covering both skill__ prefix and legacy Skill', () => {
    expect(getToolTypeFilter('skill')).toBe("AND (tc.name LIKE 'skill__%' OR tc.name = 'Skill')")
  })

  it('returns exclusion filter for builtin type excluding mcp, skill__ and Skill', () => {
    expect(getToolTypeFilter('builtin')).toBe("AND tc.name NOT LIKE 'mcp__%' AND tc.name NOT LIKE 'skill__%' AND tc.name != 'Skill'")
  })

  it('returns empty string for null (all types)', () => {
    expect(getToolTypeFilter(null)).toBe('')
    expect(getToolTypeFilter('')).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm --filter @aiusage/cli test -- tests/api/tool-classification.test.ts --reporter=verbose 2>&1 | grep -E "PASS|FAIL|skill|✓|✗"
```

Expected: new `skill__` and `getSkillDisplayName` tests FAIL (functions not yet updated in server.ts).

- [ ] **Step 3: Update `classifyToolCall` in `packages/cli/src/api/server.ts` (line ~79)**

Replace:
```typescript
function classifyToolCall(name: string): 'mcp' | 'skill' | 'builtin' {
  if (name.startsWith('mcp__')) return 'mcp'
  if (name === 'Skill') return 'skill'
  return 'builtin'
}
```

With:
```typescript
function classifyToolCall(name: string): 'mcp' | 'skill' | 'builtin' {
  if (name.startsWith('mcp__')) return 'mcp'
  if (name.startsWith('skill__') || name === 'Skill') return 'skill'
  return 'builtin'
}
```

- [ ] **Step 4: Update `getToolTypeFilter` in `packages/cli/src/api/server.ts` (line ~96)**

Replace:
```typescript
function getToolTypeFilter(toolType: string | null): string {
  if (toolType === 'mcp') return "AND tc.name LIKE 'mcp__%'"
  if (toolType === 'skill') return "AND tc.name = 'Skill'"
  if (toolType === 'builtin') return "AND tc.name NOT LIKE 'mcp__%' AND tc.name != 'Skill'"
  return ''
}
```

With:
```typescript
function getToolTypeFilter(toolType: string | null): string {
  if (toolType === 'mcp') return "AND tc.name LIKE 'mcp__%'"
  if (toolType === 'skill') return "AND (tc.name LIKE 'skill__%' OR tc.name = 'Skill')"
  if (toolType === 'builtin') return "AND tc.name NOT LIKE 'mcp__%' AND tc.name NOT LIKE 'skill__%' AND tc.name != 'Skill'"
  return ''
}
```

- [ ] **Step 5: Update skill display name in the `/api/tool-calls` response mapping (line ~564)**

Find the `toolCalls` mapping block:
```typescript
        const toolCalls = rows.map(r => {
          const type = classifyToolCall(r.name)
          const parsed = type === 'mcp' ? parseMcpName(r.name) : null
          return {
            name: r.name,
            displayName: parsed ? parsed.display : r.name,
            mcpServer: parsed ? parsed.server : null,
            type,
            count: r.count,
            percentage: Math.round((r.count / total) * 1000) / 10,
          }
        })
```

Replace with:
```typescript
        const toolCalls = rows.map(r => {
          const type = classifyToolCall(r.name)
          const mcpParsed = type === 'mcp' ? parseMcpName(r.name) : null
          const displayName = mcpParsed
            ? mcpParsed.display
            : (type === 'skill' && r.name.startsWith('skill__'))
              ? r.name.slice('skill__'.length)
              : r.name
          return {
            name: r.name,
            displayName,
            mcpServer: mcpParsed ? mcpParsed.server : null,
            type,
            count: r.count,
            percentage: Math.round((r.count / total) * 1000) / 10,
          }
        })
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm --filter @aiusage/cli test -- tests/api/tool-classification.test.ts --reporter=verbose 2>&1 | grep -E "PASS|FAIL|✓|✗"
```

Expected: all tests pass.

- [ ] **Step 7: Run full CLI test suite to check for regressions**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm --filter @aiusage/cli test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/tjh/WebstormProjects/aiusage
git add packages/cli/src/api/server.ts packages/cli/tests/api/tool-classification.test.ts
git commit -m "feat: classify and display skill__ prefixed tool call names"
```

---

### Task 3: Web UI — info notice for Qoder/Cursor + i18n keys

**Files:**
- Modify: `packages/web/src/lib/i18n.js` — add `noToolCallData` to `en.toolCalls` and `zh.toolCalls`
- Modify: `packages/web/src/routes/tool-calls/+page.svelte` — add notice block

Note: The web package has no unit tests for this Svelte page. The `packages/web/tests/` folder contains `api.test.ts` and `tool-selector.test.ts` — neither covers this page's rendering. Verify visually by running the dev server.

- [ ] **Step 1: Add i18n keys to `packages/web/src/lib/i18n.js`**

In the `en.toolCalls` object (around line 120), add `noToolCallData` after `badgeSkill`:

```javascript
    toolCalls: {
      title: 'Tool Calls',
      desc: 'Most frequently invoked tools by AI assistants.',
      noData: 'No tool call data',
      noDataHint: 'No tool calls recorded for this period.',
      typeAll: 'All',
      typeBuiltin: 'Built-in',
      typeMcp: 'MCP',
      typeSkill: 'Skill',
      badgeMcp: 'mcp',
      badgeSkill: 'skill',
      noToolCallData: 'Tool call data is not available in this tool\'s data source.',
    },
```

In the `zh.toolCalls` object (around line 413), add the same key:

```javascript
    toolCalls: {
      title: '工具调用',
      desc: 'AI 助手最常调用的工具排名。',
      noData: '暂无工具调用数据',
      noDataHint: '当前时间段内无工具调用记录。',
      typeAll: '全部',
      typeBuiltin: '内置',
      typeMcp: 'MCP',
      typeSkill: 'Skill',
      badgeMcp: 'mcp',
      badgeSkill: 'skill',
      noToolCallData: '该工具的数据源中不包含工具调用记录。',
    },
```

- [ ] **Step 2: Add info notice to `packages/web/src/routes/tool-calls/+page.svelte`**

Add the `NO_TOOL_CALL_TOOLS` constant and reactive declaration to the `<script>` block, right after the `TYPES` array:

```javascript
  const NO_TOOL_CALL_TOOLS = new Set(['qoder', 'cursor'])
  $: showNoToolCallNotice = NO_TOOL_CALL_TOOLS.has($selectedTool)
```

Then, in the template, add the notice block between the `<div class="filter-bar">` and `<div class="type-tabs">`:

```svelte
{#if showNoToolCallNotice}
  <div class="info-notice">
    {$t('toolCalls.noToolCallData')}
  </div>
{/if}
```

And add the style for `.info-notice` inside the `<style>` block (after `.type-tabs`):

```css
  .info-notice {
    padding: 0.6rem 0.9rem;
    margin-bottom: 1rem;
    background: var(--blue-dim);
    color: var(--blue);
    border: 1px solid var(--blue-dim);
    border-radius: 8px;
    font-size: 0.8rem;
  }
```

- [ ] **Step 3: Verify visually**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm build && cd packages/cli && node dist/cli.js serve
```

Open `http://localhost:3847/tool-calls`, select "qoder" or "cursor" from the tool selector, and confirm the blue info notice appears above the type tabs. Select "claude-code" and confirm the notice is gone.

- [ ] **Step 4: Run web tests to check for regressions**

```bash
cd /Users/tjh/WebstormProjects/aiusage
pnpm --filter @aiusage/web test 2>&1 | tail -10
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/tjh/WebstormProjects/aiusage
git add packages/web/src/lib/i18n.js packages/web/src/routes/tool-calls/+page.svelte
git commit -m "feat: show info notice on tool-calls page for tools without tool call data"
```

---

## Self-Review

**Spec coverage:**
- Skill stats show specific names → Task 1 (parser) + Task 2 (server) ✓
- Backward compat for existing `Skill` DB rows → Task 2 `classifyToolCall` keeps `|| name === 'Skill'` ✓
- Builtin filter updated to exclude `skill__` prefix → Task 2 `getToolTypeFilter` ✓
- UI annotation for Qoder/Cursor → Task 3 ✓
- Neutral wording (not "cannot implement") → Task 3 wording ✓
- Both EN and ZH i18n → Task 3 Step 1 ✓

**Placeholder scan:** No TBD, TODO, or vague steps found.

**Type consistency:** `classifyToolCall` returns `'mcp' | 'skill' | 'builtin'` consistently across Tasks 1–3. `displayName` logic uses `r.name.startsWith('skill__')` matching the stored format from Task 1.

# README Conversion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `README.md` and `README_zh.md` so the repo homepage communicates value, compatibility, onboarding, and trust faster, while preserving the existing technical reference content.

**Architecture:** Keep the current deep documentation sections, but move conversion-oriented sections to the top and middle of both README files. Edit the English README first, then mirror the same information architecture and equivalent messaging in the Chinese README.

**Tech Stack:** Markdown, GitHub README conventions, existing repo docs content

---

## File Structure

- `README.md` — English repository homepage and primary conversion surface
- `README_zh.md` — Chinese repository homepage mirroring the English structure
- `docs/superpowers/specs/2026-05-25-readme-conversion-design.md` — approved design spec to follow while editing

No new runtime code or tests are needed because this work is documentation-only. Validation happens through content review, structure checks, and markdown rendering sanity checks.

---

### Task 1: Restructure the English README hero and discovery sections

**Files:**
- Modify: `README.md`
- Reference: `docs/superpowers/specs/2026-05-25-readme-conversion-design.md`

- [ ] **Step 1: Read the current English README top section and locate the insertion point**

Run:
```bash
a1="/Users/tjh/WebstormProjects/aiusage/README.md" && python3 - <<'PY'
from pathlib import Path
p = Path('/Users/tjh/WebstormProjects/aiusage/README.md')
text = p.read_text()
for marker in ['## Why aiusage', '## Quick Start', '## Screenshots']:
    print(marker, text.find(marker))
PY
```
Expected: numeric offsets for the existing sections so you know where to rewrite the top of the file.

- [ ] **Step 2: Rewrite the README hero block with stronger value and onboarding**

Replace the current top section so it follows this structure:

```md
# aiusage

[![npm version](https://img.shields.io/npm/v/@juliantanx/aiusage)](https://www.npmjs.com/package/@juliantanx/aiusage)
[![CI](https://github.com/juliantanx/aiusage/actions/workflows/test.yml/badge.svg)](https://github.com/juliantanx/aiusage/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

Track AI coding assistant usage, token consumption, cost, and tool calls across Claude Code, Codex, OpenClaw, OpenCode, Hermes, and Qoder.

aiusage gives you one local-first place to understand how your AI coding tools are being used: tokens, cost, model mix, tool activity, projects, sessions, and multi-machine sync when you need it.

English | [中文](https://github.com/juliantanx/aiusage/blob/main/README_zh.md)

## Quick Start

```bash
npm install -g @juliantanx/aiusage
aiusage parse
aiusage serve
```

Open `http://localhost:3847` to explore the dashboard.

If aiusage is useful, consider starring the repo to help more developers discover it.
```
```

- [ ] **Step 3: Add the new audience-fit and compatibility sections**

Insert these sections immediately after `## Quick Start` and before the existing `## Screenshots` section:

```md
## Why aiusage

AI coding assistant usage is scattered by default: different tools, different local logs, different machines, and no shared view of tokens or cost.

aiusage brings that data into one local-first dashboard so you can:

- Track token usage, cost, model mix, and tool-call activity in one place.
- Aggregate usage across Claude Code, Codex, OpenClaw, OpenCode, Hermes, and Qoder.
- Understand usage over time through overview, token, cost, model, session, and project views.
- Sync across multiple machines with GitHub, S3, or R2 when shared visibility matters.
- Keep your data local by default, with optional sync only when you choose it.

## Who is this for?

aiusage is built for:

- Developers using Claude Code, Codex, or other AI coding assistants every day.
- People who want visibility into token usage and spend over time.
- Multi-tool users who want one dashboard instead of multiple disconnected logs.
- Multi-machine workflows that need optional aggregation and sync.

## Supported tools

aiusage currently supports:

- Claude Code
- Codex
- OpenClaw
- OpenCode
- Hermes
- Qoder
```
```

- [ ] **Step 4: Run a markdown sanity read of the updated top section**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
p = Path('/Users/tjh/WebstormProjects/aiusage/README.md')
text = p.read_text().splitlines()
for i, line in enumerate(text[:80], start=1):
    print(f"{i:>4} {line}")
PY
```
Expected: the first 80 lines show the new hero, Quick Start, Why aiusage, Who is this for, and Supported tools sections in the intended order.

- [ ] **Step 5: Commit the English README restructuring**

Run:
```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: restructure README hero and discovery sections

Make the GitHub landing experience clearer by surfacing value, audience fit, compatibility, and quick start before the long technical reference.
EOF
)"
```
Expected: a new docs commit is created for the English README changes.

---

### Task 2: Add use-case and FAQ conversion sections to the English README

**Files:**
- Modify: `README.md`
- Reference: `docs/superpowers/specs/2026-05-25-readme-conversion-design.md`

- [ ] **Step 1: Insert a concise use-cases section before the CLI reference**

Add this section between `## Screenshots` and `## CLI Reference`:

```md
## Common use cases

Use aiusage to:

- Track token and cost trends across AI coding assistants.
- Compare model usage and activity over time.
- Inspect tool-call volume and session-level behavior.
- Aggregate usage across multiple machines into one view.
- Run a local or Docker-hosted dashboard for ongoing visibility.
```
```

- [ ] **Step 2: Add a compact FAQ near the end of the README**

Insert this section after `## Project Structure` and before `## Friends`:

```md
## FAQ

### Does aiusage upload my data?

No. aiusage is local-first. Your usage data stays on your machine unless you explicitly configure a sync backend.

### Can I use aiusage across multiple machines?

Yes. You can sync usage data through GitHub, S3, or R2 and then view the combined result from any configured machine or Docker deployment.

### Does aiusage run a background parser automatically?

No. By default, you run `aiusage parse` manually. You can automate parsing and syncing with cron, Task Scheduler, or your own scheduler.

### Which assistants are supported?

aiusage currently supports Claude Code, Codex, OpenClaw, OpenCode, Hermes, and Qoder.

### Can I inspect the raw database myself?

Yes. aiusage stores data in a local SQLite database, and the README already documents how to open it in tools like DBeaver, TablePlus, DataGrip, or DB Browser for SQLite.
```
```

- [ ] **Step 3: Verify the new sections appear in the right order**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('/Users/tjh/WebstormProjects/aiusage/README.md').read_text()
for marker in ['## Screenshots', '## Common use cases', '## CLI Reference', '## Project Structure', '## FAQ', '## Friends']:
    print(marker, text.find(marker))
PY
```
Expected: all markers exist and the offsets increase in the intended order.

- [ ] **Step 4: Commit the English README conversion sections**

Run:
```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: add README use cases and FAQ

Improve README conversion and trust by connecting features to real workflows and answering the most common adoption questions up front.
EOF
)"
```
Expected: a new docs commit is created for the use-case and FAQ additions.

---

### Task 3: Mirror the new README structure in Chinese

**Files:**
- Modify: `README_zh.md`
- Reference: `README.md`
- Reference: `docs/superpowers/specs/2026-05-25-readme-conversion-design.md`

- [ ] **Step 1: Read the current Chinese README top section and section ordering**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
p = Path('/Users/tjh/WebstormProjects/aiusage/README_zh.md')
text = p.read_text()
for marker in ['## 为什么使用 aiusage', '## 快速开始', '## Screenshots', '## 截图', '## 项目结构', '## 友情链接']:
    print(marker, text.find(marker))
PY
```
Expected: offsets reveal the current section names and where to mirror the English structure.

- [ ] **Step 2: Rewrite the Chinese hero and top conversion sections with matching structure**

Update the Chinese README top so it mirrors the English README with equivalent meaning, using this content pattern:

```md
# aiusage

[![npm version](https://img.shields.io/npm/v/@juliantanx/aiusage)](https://www.npmjs.com/package/@juliantanx/aiusage)
[![CI](https://github.com/juliantanx/aiusage/actions/workflows/test.yml/badge.svg)](https://github.com/juliantanx/aiusage/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

在一个地方追踪 Claude Code、Codex、OpenClaw、OpenCode、Hermes 和 Qoder 的 AI 编程助手使用情况，包括 token 消耗、费用和工具调用。

aiusage 为你提供一个本地优先的统一视图，用来理解 AI 编程工具的使用情况：token、成本、模型分布、工具活跃度、项目、会话，以及按需启用的多设备同步。

[English](https://github.com/juliantanx/aiusage/blob/main/README.md) | 中文

## 快速开始

```bash
npm install -g @juliantanx/aiusage
aiusage parse
aiusage serve
```

打开 `http://localhost:3847` 即可查看仪表盘。

如果 aiusage 对你有帮助，欢迎给仓库点一个 Star，帮助更多开发者发现它。

## 为什么使用 aiusage

默认情况下，AI 编程助手的使用数据是分散的：不同工具、不同本地日志、不同机器，而且很难统一查看 token 和成本。

aiusage 把这些数据汇总到一个本地优先的仪表盘中，让你可以：

- 在一个地方查看 token 用量、成本、模型分布和工具调用活跃度。
- 汇总 Claude Code、Codex、OpenClaw、OpenCode、Hermes 和 Qoder 的使用数据。
- 通过概览、token、成本、模型、会话和项目视图理解长期使用趋势。
- 在需要共享视图时，通过 GitHub、S3 或 R2 在多台设备之间同步。
- 默认保持数据本地，仅在你明确配置时才启用同步。

## 适合谁使用？

aiusage 适合：

- 每天都在使用 Claude Code、Codex 或其他 AI 编程助手的开发者。
- 希望长期跟踪 token 用量和成本变化的人。
- 同时使用多种 AI 编程工具、希望统一查看数据的用户。
- 需要跨多台机器汇总使用情况的个人或团队。

## 已支持的工具

aiusage 当前支持：

- Claude Code
- Codex
- OpenClaw
- OpenCode
- Hermes
- Qoder
```
```

- [ ] **Step 3: Add Chinese equivalents of Common use cases and FAQ**

Add the following sections in positions mirroring the English README:

```md
## 常见使用场景

你可以用 aiusage 来：

- 跟踪不同 AI 编程助手的 token 与成本趋势。
- 比较模型使用情况和长期活跃度。
- 查看工具调用频率与会话级行为。
- 汇总多台设备上的使用数据。
- 通过本地部署或 Docker 持续运行可视化仪表盘。

## 常见问题

### aiusage 会上传我的数据吗？

不会。aiusage 是本地优先的，你的数据默认保留在本机，除非你主动配置同步后端。

### 我可以在多台机器上使用 aiusage 吗？

可以。你可以通过 GitHub、S3 或 R2 同步数据，然后在任意一台已配置的机器或 Docker 部署中查看聚合结果。

### aiusage 会自动在后台解析日志吗？

不会。默认情况下需要你手动运行 `aiusage parse`。如果需要自动化，可以通过 cron、任务计划程序或你自己的调度系统来执行。

### 目前支持哪些助手？

目前支持 Claude Code、Codex、OpenClaw、OpenCode、Hermes 和 Qoder。

### 我可以直接查看原始数据库吗？

可以。aiusage 使用本地 SQLite 数据库保存数据，README 中已经说明如何用 DBeaver、TablePlus、DataGrip 或 DB Browser for SQLite 直接打开查看。
```
```

- [ ] **Step 4: Compare English and Chinese section headings for structural alignment**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
for name in ['README.md', 'README_zh.md']:
    print(f'--- {name} ---')
    for line in Path(f'/Users/tjh/WebstormProjects/aiusage/{name}').read_text().splitlines():
        if line.startswith('## '):
            print(line)
PY
```
Expected: both files show matching section progression even though the wording differs by language.

- [ ] **Step 5: Commit the Chinese README alignment changes**

Run:
```bash
git add README_zh.md
git commit -m "$(cat <<'EOF'
docs: align Chinese README with new landing structure

Mirror the English README conversion improvements in Chinese so both audiences get the same onboarding, compatibility, and trust signals.
EOF
)"
```
Expected: a new docs commit is created for the Chinese README updates.

---

### Task 4: Verify the full documentation change set and prepare the final combined commit

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`
- Existing untracked/modified files already prepared in repo root and `.github/`

- [ ] **Step 1: Review git status to confirm the final change set**

Run:
```bash
git status --short
```
Expected: README files plus the previously created docs/community files appear as modified or untracked.

- [ ] **Step 2: Read the beginning and end of both README files to sanity-check final structure**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
for name in ['README.md', 'README_zh.md']:
    lines = Path(f'/Users/tjh/WebstormProjects/aiusage/{name}').read_text().splitlines()
    print(f'--- {name} top ---')
    for line in lines[:60]:
        print(line)
    print(f'--- {name} bottom ---')
    for line in lines[-30:]:
        print(line)
PY
```
Expected: the top shows the new landing structure and the bottom still includes Star History, Contributing, and License.

- [ ] **Step 3: Stage the full intended change set explicitly**

Run:
```bash
git add README.md README_zh.md CONTRIBUTING.md LICENSE .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md .github/PULL_REQUEST_TEMPLATE.md docs/assets/social-preview.png
```
Expected: only the intended growth/readme/community files are staged.

- [ ] **Step 4: Create the final combined commit for the user-requested repo optimization work**

Run:
```bash
git commit -m "$(cat <<'EOF'
docs: improve repo presentation and contributor onboarding

Strengthen the GitHub landing experience with a clearer README structure, community templates, licensing, and social preview assets so the project is easier to trust, discover, and contribute to.
EOF
)"
```
Expected: a final docs commit is created covering the repo presentation improvements requested by the user.

- [ ] **Step 5: Verify the working tree is clean or explain any remaining files**

Run:
```bash
git status --short
```
Expected: either no output, or only expected leftovers that are clearly explainable.

---

## Self-Review

### Spec coverage
- Hero/value proposition: covered in Task 1
- Audience fit and supported tools: covered in Task 1
- Use cases and FAQ: covered in Task 2
- Chinese README alignment: covered in Task 3
- Preserve technical reference sections and footer trust content: checked in Task 4
- Commit current repo-optimization changes: covered in Task 4

### Placeholder scan
No TBD/TODO placeholders remain. Each task includes exact files, content, commands, and expected results.

### Type consistency
This plan only changes Markdown files and community docs. Section names, file paths, and commit scopes are consistent across tasks.

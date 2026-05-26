import { describe, expect, it } from 'vitest'
import { extractProject, extractProjectFromCwd } from '../../src/api/project-extraction.js'

describe('extractProject', () => {
  it('keeps existing claude project decoding behavior', () => {
    expect(
      extractProject('/Users/tjh/.claude/projects/-Users-tjh-WebstormProjects-aiusage/session.jsonl')
    ).toBe('aiusage')
  })

  it('falls back to a readable parent directory for generic local paths', () => {
    expect(
      extractProject('/Users/tjh/worktrees/aiusage/sessions/abc123.jsonl')
    ).toBe('aiusage')
  })

  it('skips generic trailing directories such as logs and data', () => {
    expect(
      extractProject('/Users/tjh/projects/aiusage/data/logs/run.jsonl')
    ).toBe('aiusage')
  })

  it('extracts qoder project names from session segment paths', () => {
    expect(
      extractProject('/Users/example/.qoder/logs/sessions/-Users-example-code-aiusage/session-1/segments/2026-05-24T02-03-23.jsonl')
    ).toBe('code/aiusage')
  })

  it('joins multi-level claude project paths with / not -', () => {
    expect(
      extractProject('/Users/tjh/.claude/projects/-Users-tjh-WebstormProjects-myorg-myproject/session.jsonl')
    ).toBe('myorg/myproject')
  })

  it('returns unknown when every directory is generic or machine-like', () => {
    expect(
      extractProject('/tmp/data/logs/2026/05/16/123e4567-e89b-12d3-a456-426614174000.jsonl')
    ).toBe('unknown')
  })

  it('returns unknown for empty sourceFile', () => {
    expect(extractProject('')).toBe('unknown')
  })
})

describe('extractProjectFromCwd', () => {
  it('strips WebstormProjects workspace root', () => {
    expect(extractProjectFromCwd('/Users/tjh/WebstormProjects/ai-bidding-assistant')).toBe('ai-bidding-assistant')
  })

  it('returns project root even when cwd is a subdirectory', () => {
    expect(extractProjectFromCwd('/Users/tjh/WebstormProjects/aiusage/packages/cli')).toBe('aiusage')
  })

  it('strips Documents workspace root', () => {
    expect(extractProjectFromCwd('/Users/tjh/Documents/重庆邮电大学/课程/作业')).toBe('重庆邮电大学')
  })

  it('handles path without a workspace root', () => {
    expect(extractProjectFromCwd('/Users/tjh/Typora/notes')).toBe('Typora')
  })

  it('returns unknown for empty cwd', () => {
    expect(extractProjectFromCwd('')).toBe('unknown')
  })

  it('handles Windows-style paths', () => {
    expect(extractProjectFromCwd('C:/Users/tjh/WebstormProjects/myproject')).toBe('myproject')
  })
})

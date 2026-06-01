import type Database from 'better-sqlite3'
import type { Tool } from '@aiusage/core'
import type { StatsRecord } from '@aiusage/core'
import { generateRecordId, inferProvider, calculateCost } from '@aiusage/core'
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'

interface KiloCodeContext {
  dbPath: string
  device: string
  deviceInstanceId: string
  platform?: string
  now: number
  cursor: number
  exchangeRate?: number
}

interface KiloCodeUiMessage {
  ts: number
  type: string
  say: string
  text: string
}

interface KiloCodeTokenData {
  apiProtocol: string
  tokensIn: number
  tokensOut: number
  cacheWrites: number
  cacheReads: number
  cost: number
  usageMissing: boolean
  model?: string
}

interface KiloCodeParseResult {
  records: StatsRecord[]
  nextCursor: number
  errors: string[]
}

interface TaskMetadata {
  files_in_context?: Array<{
    path: string
    record_source?: string
  }>
}

/**
 * Find all KiloCode task directories with ui_messages.json files
 */
function findKiloCodeTaskDirs(basePath: string): string[] {
  const taskDirs: string[] = []

  if (!existsSync(basePath)) return taskDirs

  try {
    const tasksDir = join(basePath, 'tasks')
    if (!existsSync(tasksDir)) return taskDirs

    const entries = readdirSync(tasksDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const taskDir = join(tasksDir, entry.name)
      const uiMessagesPath = join(taskDir, 'ui_messages.json')

      if (existsSync(uiMessagesPath)) {
        taskDirs.push(taskDir)
      }
    }
  } catch (e) {
    // Log error but continue
    console.error(`Error scanning KiloCode tasks directory: ${e}`)
  }

  return taskDirs
}

/**
 * Extract project path from task_metadata.json
 */
function extractProjectPath(taskDir: string): string {
  try {
    const metadataPath = join(taskDir, 'task_metadata.json')
    if (!existsSync(metadataPath)) return 'unknown'

    const content = readFileSync(metadataPath, 'utf-8')
    const metadata: TaskMetadata = JSON.parse(content)

    // Try to get project path from first file in context
    if (metadata.files_in_context && metadata.files_in_context.length > 0) {
      const firstFile = metadata.files_in_context[0].path
      if (firstFile) {
        // Extract project name from path (e.g., "D:/projects/my-project/src/file.ts" -> "my-project")
        const parts = firstFile.replace(/\\/g, '/').split('/')
        // Look for common project indicators (src, lib, app, etc.)
        const srcIndex = parts.findIndex(p => ['src', 'lib', 'app', 'server', 'client'].includes(p.toLowerCase()))
        if (srcIndex > 0) {
          return parts[srcIndex - 1]
        }
        // Fallback to first directory after drive letter or home
        return parts[parts.length > 2 ? 2 : 0] || 'unknown'
      }
    }
  } catch (e) {
    // Metadata parse error - use default
  }

  return 'unknown'
}

/**
 * Parse KiloCode ui_messages.json file
 */
function parseUiMessagesFile(
  filePath: string,
  context: KiloCodeContext,
  taskDir: string
): StatsRecord[] {
  const records: StatsRecord[] = []

  try {
    const content = readFileSync(filePath, 'utf-8')
    const messages: KiloCodeUiMessage[] = JSON.parse(content)

    // Get cursor position (skip already processed messages)
    const startIndex = context.cursor

    for (let i = startIndex; i < messages.length; i++) {
      const msg = messages[i]

      // Only process api_req_started messages
      if (msg.type !== 'say' || msg.say !== 'api_req_started') continue

      let tokenData: KiloCodeTokenData
      try {
        tokenData = JSON.parse(msg.text)
      } catch {
        continue
      }

      // Extract token information
      const inputTokens = tokenData.tokensIn ?? 0
      const outputTokens = tokenData.tokensOut ?? 0
      const cacheReadTokens = tokenData.cacheReads ?? 0
      const cacheWriteTokens = tokenData.cacheWrites ?? 0

      // Skip if no token data
      if (inputTokens === 0 && outputTokens === 0) continue

      const ts = typeof msg.ts === 'number' ? msg.ts : new Date(msg.ts).getTime()
      const model = tokenData.model ?? inferModelFromProtocol(tokenData.apiProtocol) ?? 'unknown'

      const cost = model === 'unknown' ? 0 : calculateCost(model, {
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheWriteTokens,
        thinkingTokens: 0,
      }, context.exchangeRate)

      const costSource = model === 'unknown' ? ('unknown' as const) : ('pricing' as const)
      const provider = inferProvider(model)

      // Extract project path as cwd
      const cwd = extractProjectPath(taskDir)

      const record: StatsRecord = {
        id: generateRecordId(context.deviceInstanceId, filePath, i),
        ts,
        ingestedAt: context.now,
        updatedAt: context.now,
        lineOffset: i,
        tool: 'kilocode' as Tool,
        model,
        provider,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheWriteTokens,
        thinkingTokens: 0,
        cost,
        costSource,
        sessionId: extractSessionIdFromTaskDir(taskDir),
        sourceFile: filePath,
        device: context.device,
        deviceInstanceId: context.deviceInstanceId,
        platform: context.platform || '',
        cwd,
      }

      records.push(record)
    }
  } catch (e) {
    // File parse error - logged by caller
    throw e
  }

  return records
}

/**
 * Infer model from API protocol
 */
function inferModelFromProtocol(protocol: string): string | null {
  const protocolLower = protocol.toLowerCase()

  if (protocolLower.includes('openai') || protocolLower.includes('gpt')) {
    return 'gpt-4o'
  }
  if (protocolLower.includes('anthropic') || protocolLower.includes('claude')) {
    return 'claude-sonnet-4-6'
  }
  if (protocolLower.includes('gemini')) {
    return 'gemini-2.5-flash'
  }

  return null
}

/**
 * Extract session ID from task directory path
 */
function extractSessionIdFromTaskDir(taskDir: string): string {
  // Task directory format: .../tasks/<task-id>/
  const parts = taskDir.replace(/\\/g, '/').split('/')
  const taskId = parts[parts.lastIndexOf('tasks') + 1]
  return taskId || 'unknown'
}

/**
 * Run KiloCode parsing
 */
export function runParseKiloCode(basePath: string, context: KiloCodeContext): KiloCodeParseResult {
  const records: StatsRecord[] = []
  const errors: string[] = []
  let nextCursor = context.cursor
  let totalMessagesProcessed = 0

  // Find all task directories with ui_messages.json
  const taskDirs = findKiloCodeTaskDirs(basePath)

  for (const taskDir of taskDirs) {
    const uiMessagesPath = join(taskDir, 'ui_messages.json')

    try {
      const stat = statSync(uiMessagesPath)
      const dirRecords = parseUiMessagesFile(uiMessagesPath, context, taskDir)
      records.push(...dirRecords)

      // Update cursor to total messages processed across all files
      const content = readFileSync(uiMessagesPath, 'utf-8')
      const messages: KiloCodeUiMessage[] = JSON.parse(content)
      totalMessagesProcessed = Math.max(totalMessagesProcessed, messages.length)
    } catch (e) {
      errors.push(`${uiMessagesPath}: ${e instanceof Error ? e.message : e}`)
    }
  }

  // Set next cursor to total messages processed
  nextCursor = totalMessagesProcessed

  return {
    records,
    nextCursor,
    errors,
  }
}

export function defaultKiloCodePath(): string {
  const home = require('node:os').homedir()
  const platform = require('node:os').platform()

  if (platform === 'win32') {
    // Windows: %APPDATA%\Code\User\globalStorage\kilocode.kilo-code\
    const appData = process.env.APPDATA ?? join(home, 'AppData', 'Roaming')
    return join(appData, 'Code', 'User', 'globalStorage', 'kilocode.kilo-code')
  }
  if (platform === 'darwin') {
    // macOS: ~/Library/Application Support/Code/User/globalStorage/kilocode.kilo-code/
    return join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code')
  }
  // Linux: ~/.config/Code/User/globalStorage/kilocode.kilo-code/
  const xdgConfigHome = process.env.XDG_CONFIG_HOME ?? join(home, '.config')
  return join(xdgConfigHome, 'Code', 'User', 'globalStorage', 'kilocode.kilo-code')
}

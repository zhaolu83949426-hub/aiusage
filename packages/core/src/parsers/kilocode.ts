import type { Parser, ParseResult, ParseContext } from '../types.js'
import type { StatsRecord } from '../types.js'
import { generateRecordId } from '../record-id.js'
import { inferProvider } from '../provider.js'
import { calculateCost } from '../pricing.js'

interface KiloCodeApiMessage {
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
  model?: string // May be present in newer versions
}

export class KiloCodeParser implements Parser {
  readonly tool = 'kilocode'

  parseLine(line: string, context: ParseContext): ParseResult | null {
    let parsed: KiloCodeApiMessage
    try {
      parsed = JSON.parse(line)
    } catch {
      return null
    }

    // KiloCode stores token data in ui_messages.json with format:
    // { "ts": timestamp, "type": "say", "say": "api_req_started", "text": "{...}" }
    if (parsed.type !== 'say' || parsed.say !== 'api_req_started') {
      return null
    }

    let tokenData: KiloCodeTokenData
    try {
      tokenData = JSON.parse(parsed.text)
    } catch {
      return null
    }

    // Extract token information
    const inputTokens = tokenData.tokensIn ?? 0
    const outputTokens = tokenData.tokensOut ?? 0
    const cacheReadTokens = tokenData.cacheReads ?? 0
    const cacheWriteTokens = tokenData.cacheWrites ?? 0

    // Skip if no token data
    if (inputTokens === 0 && outputTokens === 0) {
      return null
    }

    const ts = typeof parsed.ts === 'number' ? parsed.ts : new Date(parsed.ts).getTime()
    const model = tokenData.model ?? this.inferModelFromProtocol(tokenData.apiProtocol) ?? 'unknown'

    const cost = model === 'unknown' ? 0 : calculateCost(model, {
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      thinkingTokens: 0,
    }, context.exchangeRate)

    const costSource = model === 'unknown' ? ('unknown' as const) : ('pricing' as const)
    const provider = inferProvider(model)

    const recordId = generateRecordId(context.deviceInstanceId, context.sourceFile, context.lineOffset)

    const record: StatsRecord = {
      id: recordId,
      ts,
      ingestedAt: context.now,
      updatedAt: context.now,
      lineOffset: context.lineOffset,
      tool: this.tool,
      model,
      provider,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      thinkingTokens: 0,
      cost,
      costSource,
      sessionId: context.sessionId,
      sourceFile: context.sourceFile,
      device: context.device,
      deviceInstanceId: context.deviceInstanceId,
      platform: context.platform,
    }

    return { record, toolCalls: [] }
  }

  finalize(): ParseResult[] {
    return []
  }

  private inferModelFromProtocol(protocol: string): string | null {
    // Try to infer model from API protocol
    // This is a fallback for when KiloCode doesn't record the model name
    const protocolLower = protocol.toLowerCase()

    if (protocolLower.includes('openai') || protocolLower.includes('gpt')) {
      return 'gpt-4o' // Common default for OpenAI
    }
    if (protocolLower.includes('anthropic') || protocolLower.includes('claude')) {
      return 'claude-sonnet-4-6' // Common default for Claude
    }
    if (protocolLower.includes('gemini')) {
      return 'gemini-2.5-flash'
    }

    return null
  }
}

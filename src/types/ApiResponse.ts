import type { AssistantMessage } from "#src/types/AssistantMessage.ts"
import type { Usage } from "#src/types/Usage.ts"

type StopReason = "end_turn" | "tool_use"

export type ApiResponse = {
  stop_reason: StopReason
  usage: Usage
} & AssistantMessage

import type { AssistantMessage } from "./AssistantMessage.ts"
import type { Usage } from "./Usage.ts"

type StopReason = "end_turn" | "tool_use"

export type ApiResponse = {
  stop_reason: StopReason
  usage: Usage
} & AssistantMessage

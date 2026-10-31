import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import query from "#src/query.ts"
import type { ApiErrorBody } from "#src/types/ApiError.ts"
import type { ApiResponse } from "#src/types/ApiResponse.ts"
import type { ToolUseContent } from "#src/types/ToolUseContent.ts"
import {
  apiResponse,
  assistantMessage,
  textContent,
  thinkingContent,
  toolResultContent,
  toolUseContent,
  toolUseId,
  userMessage,
} from "#tests/factories/index.ts"
import mockQuery from "#tests/helpers/mockQuery.ts"
import mockQueryError from "./helpers/mockQueryError.ts"

const createFileForTest = async (
  name: string,
  content: string,
): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), "harness-"))
  const filePath = join(directory, name)
  await writeFile(filePath, content)
  return filePath
}

describe("query()", () => {
  it("returns messages", async () => {
    const helloMessage = userMessage([textContent("hello")])
    const helloResponseMessage = assistantMessage([
      textContent("Hello! How can I help you today?"),
    ])

    mockQuery({
      messages: [helloMessage],
      apiResponse: apiResponse({ ...helloResponseMessage }),
    })

    const { messages } = await query([helloMessage])

    expect(messages).toEqual([helloMessage, helloResponseMessage])
  })

  it("returns usage", async () => {
    const helloMessage = userMessage([textContent("hello")])
    const helloResponseMessage = assistantMessage([
      textContent("Hello! How can I help you today?"),
    ])

    mockQuery({
      messages: [helloMessage],
      apiResponse: apiResponse({
        ...helloResponseMessage,
        usage: {
          input_tokens: 1,
          output_tokens: 2,
          cache_read_input_tokens: 3,
          cache_creation_input_tokens: 4,
        },
      }),
    })

    const { usage } = await query([helloMessage])

    expect(usage).toEqual({
      input_tokens: 1,
      output_tokens: 2,
      cache_read_input_tokens: 3,
      cache_creation_input_tokens: 4,
    })
  })

  describe("reading a file local to the harness", () => {
    it("returns messages containing the read file", async () => {
      const todos = "groceries"
      const filePath = await createFileForTest("todos.md", todos)
      const prompt = `What are the contents of ${filePath}?`
      const preToolUseThinking = thinkingContent("I need to use a tool...")
      const toolUse = toolUseContent({
        name: "read_file",
        input: { path: filePath, encoding: "utf8" },
      })

      const promptMessage = userMessage([textContent(prompt)])
      const toolUseMessage = assistantMessage([preToolUseThinking, toolUse])
      const toolResultMessage = userMessage([
        toolResultContent(toolUse, { content: todos }),
      ])
      const answerMessage = assistantMessage([
        textContent(`${filePath} contains '${todos}'`),
      ])

      const previousMessages = mockQuery({
        messages: [promptMessage],
        apiResponse: apiResponse({
          ...toolUseMessage,
          stop_reason: "tool_use",
        }),
      })

      mockQuery({
        messages: [...previousMessages, toolResultMessage],
        apiResponse: apiResponse({ ...answerMessage, stop_reason: "end_turn" }),
      })

      const { messages } = await query([promptMessage])

      expect(messages).toEqual([
        promptMessage,
        toolUseMessage,
        toolResultMessage,
        answerMessage,
      ])
    })

    it("returns usage considering tokens used to read the file", async () => {
      const todos = "groceries"
      const filePath = await createFileForTest("todos.md", todos)
      const prompt = `What are the contents of ${filePath}?`
      const preToolUseThinking = thinkingContent("I need to use a tool...")
      const toolUse = toolUseContent({
        name: "read_file",
        input: { path: filePath, encoding: "utf8" },
      })

      const promptMessage = userMessage([textContent(prompt)])
      const toolUseMessage = assistantMessage([preToolUseThinking, toolUse])
      const toolResultMessage = userMessage([
        toolResultContent(toolUse, { content: todos }),
      ])
      const answerMessage = assistantMessage([
        textContent(`${filePath} contains '${todos}'`),
      ])

      const previousMessages = mockQuery({
        messages: [promptMessage],
        apiResponse: apiResponse({
          ...toolUseMessage,
          stop_reason: "tool_use",
          usage: {
            input_tokens: 10,
            output_tokens: 20,
            cache_read_input_tokens: 30,
            cache_creation_input_tokens: 40,
          },
        }),
      })

      mockQuery({
        messages: [...previousMessages, toolResultMessage],
        apiResponse: apiResponse({
          ...answerMessage,
          stop_reason: "end_turn",
          usage: {
            input_tokens: 1,
            output_tokens: 2,
            cache_read_input_tokens: 3,
            cache_creation_input_tokens: 4,
          },
        }),
      })

      const { usage } = await query([promptMessage])

      expect(usage).toEqual({
        input_tokens: 11,
        output_tokens: 22,
        cache_read_input_tokens: 33,
        cache_creation_input_tokens: 44,
      })
    })
  })

  describe("asking the harness to do something it cannot", () => {
    describe("when the harness's tool does not exist", () => {
      it("tells the model", async () => {
        const promptMessage = userMessage([
          textContent("Make my harness run a 5k."),
        ])
        const unavailableToolUse: ToolUseContent = {
          type: "tool_use",
          id: toolUseId("123"),
          name: "run_three_miles",
          input: { drinks: "gatorade" },
        }
        const unavailableToolUseMessage = assistantMessage([unavailableToolUse])
        const unavailableToolResultMessage = userMessage([
          toolResultContent(unavailableToolUse, {
            content: `${unavailableToolUse.name} is not a tool.`,
            is_error: true,
          }),
        ])
        const modelsApologyMessage = assistantMessage([textContent("Whoops!")])

        const previousMessages = mockQuery({
          messages: [promptMessage],
          apiResponse: apiResponse({
            ...unavailableToolUseMessage,
            stop_reason: "tool_use",
          }),
        })

        mockQuery({
          messages: [...previousMessages, unavailableToolResultMessage],
          apiResponse: apiResponse({
            ...modelsApologyMessage,
            stop_reason: "end_turn",
          }),
        })

        const { messages } = await query([promptMessage])

        expect(messages).toEqual([
          promptMessage,
          unavailableToolUseMessage,
          unavailableToolResultMessage,
          modelsApologyMessage,
        ])
      })
    })

    describe("when the harness's tool crashes", () => {
      it("tells the model", async () => {
        const directory = await mkdtemp(join(tmpdir(), "harness-"))
        const missingPath = join(directory, "todos.md")
        const promptMessage = userMessage([
          textContent(`What are the contents of ${missingPath}?`),
        ])
        const toolUse = toolUseContent({
          name: "read_file",
          input: { path: missingPath, encoding: "utf8" },
        })
        const toolUseMessage = assistantMessage([toolUse])
        const errorResultMessage = userMessage([
          toolResultContent(toolUse, {
            content: `ENOENT: no such file or directory, open '${missingPath}'`,
            is_error: true,
          }),
        ])
        const answerMessage = assistantMessage([
          textContent(`${missingPath} does not exist.`),
        ])

        const previousMessages = mockQuery({
          messages: [promptMessage],
          apiResponse: apiResponse({
            ...toolUseMessage,
            stop_reason: "tool_use",
          }),
        })

        mockQuery({
          messages: [...previousMessages, errorResultMessage],
          apiResponse: apiResponse({
            ...answerMessage,
            stop_reason: "end_turn",
          }),
        })

        const { messages } = await query([promptMessage])

        expect(messages).toEqual([
          promptMessage,
          toolUseMessage,
          errorResultMessage,
          answerMessage,
        ])
      })
    })
  })

  describe("when the api responds with an unrecognized json shape", () => {
    it("throws", async () => {
      const messages = [userMessage([textContent("hello")])]
      const replyWithoutContent = { type: "message" } as unknown as ApiResponse
      mockQuery({ messages, apiResponse: replyWithoutContent })

      await expect(query(messages)).rejects.toThrow(
        "content: Invalid input: expected array, received undefined",
      )
    })
  })

  describe("when cloudflare breaks", () => {
    it("throws", async () => {
      const messages = [userMessage([textContent("hello")])]
      const gatewayPage = "<html>Bad gateway</html>" as unknown as ApiErrorBody
      mockQueryError({ messages, apiError: { status: 502, body: gatewayPage } })

      await expect(query(messages)).rejects.toThrow(
        "HTTP 502: <html>Bad gateway</html>",
      )
    })
  })

  describe("when the api request fails", () => {
    it("throws", async () => {
      const messages = [userMessage([textContent("hello")])]
      mockQueryError({
        messages,
        apiError: {
          status: 401,
          body: {
            type: "error",
            error: {
              type: "authentication_error",
              message: "x-api-key header is required",
            },
          },
        },
      })

      await expect(query(messages)).rejects.toThrow(
        "authentication_error: x-api-key header is required",
      )
    })
  })

  describe("when max_tokens is hit", () => {
    it("returns the partially generated message", async () => {
      const promptMessage = userMessage([textContent("hey")])
      const responseMessage = assistantMessage([
        thinkingContent("hm..."),
        textContent("Good! How ar"),
      ])
      mockQuery({
        messages: [promptMessage],
        apiResponse: apiResponse({
          ...responseMessage,
          stop_reason: "max_tokens",
        }),
      })

      const { messages, stop_reason } = await query([promptMessage])

      expect(messages).toEqual([promptMessage, responseMessage])
      expect(stop_reason).toEqual("max_tokens")
    })
  })
})

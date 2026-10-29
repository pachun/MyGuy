import { exec } from "node:child_process"
import { promisify } from "node:util"
import defineTool from "#src/tools/defineTool.ts"

const execute = promisify(exec)

const shell = defineTool(
  {
    name: "shell",
    description: `
      import { exec } from "node:child_process"
      import { promisify } from "node:util"
      const execute = promisify(exec)
      const { stdout, stderr } = await execute(command, { cwd, timeout })
      return JSON.stringify({ stdout, stderr })
    `,
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string" },
        cwd: { type: "string" },
        timeout: { type: "integer" },
      },
      required: ["command"],
    },
  },
  async ({ command, cwd, timeout }) => {
    const { stdout, stderr } = await execute(command, { cwd, timeout })
    return JSON.stringify({ stdout, stderr })
  },
)

export default shell

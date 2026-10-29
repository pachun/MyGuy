import { readFile as readFileFromDisk } from "node:fs/promises"
import defineTool from "#src/tools/defineTool.ts"

const readFile = defineTool(
  {
    name: "read_file",
    description: `
      import { readFile } from "node:fs/promises"
      return readFile(path, encoding)
    `,
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        encoding: {
          type: "string",
          enum: [
            "utf8",
            "utf-8",
            "utf16le",
            "utf-16le",
            "ucs2",
            "ucs-2",
            "latin1",
            "ascii",
            "binary",
            "base64",
            "base64url",
            "hex",
          ],
        },
      },
      required: ["path", "encoding"],
    },
  },
  ({ path, encoding }) => readFileFromDisk(path, encoding),
)

export default readFile

import type { InputOf, Property, Tool } from "#src/types/Tool.ts"

const defineTool = <
  const Name extends string,
  const Required extends string,
  const Properties extends Record<Required, Property>,
>(
  definition: Tool<Name, Required, Properties>,
  run: (input: InputOf<Required, Properties>) => Promise<string>,
) => ({
  definition,
  run: (input: unknown) => run(input as InputOf<Required, Properties>),
})

export default defineTool

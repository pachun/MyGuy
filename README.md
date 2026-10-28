```sh
# set ANTHROPIC_API_KEY in .env
bun repl
const { default: query } = await import("./src/query.ts")
const messages = await query("hello")
await query("What did I say?", messages)
```

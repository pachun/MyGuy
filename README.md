```sh
# set ANTHROPIC_API_KEY in .env
bun repl
const { default: prompt } = await import("./src/prompt.ts")
await prompt("hello")
```

const apiKeyIsConfigured = process.env.ANTHROPIC_API_KEY !== undefined

console.log(
  apiKeyIsConfigured
    ? "API key loaded from .env"
    : "ANTHROPIC_API_KEY is not set; copy .env.example to .env",
)

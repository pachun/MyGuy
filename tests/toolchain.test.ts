import { expect, test } from "vitest"

test("vitest runs TypeScript from the test directory", () => {
  const sum = [1, 2, 3].reduce((total, value) => total + value, 0)

  expect(sum).toBe(6)
})

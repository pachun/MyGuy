import nock from "nock"
import { afterEach, expect } from "vitest"

const bodyMismatchPrefix = "Body mismatch: expected "
const bodyMismatchSeparator = ", got "

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const expectedAndReceivedBodies = (bodyMismatch: string) => {
  const bodies = bodyMismatch.slice(bodyMismatchPrefix.length)
  return [...bodies.matchAll(new RegExp(bodyMismatchSeparator, "g"))]
    .map(({ index }) => ({
      expected: parseJson(bodies.slice(0, index)),
      received: parseJson(bodies.slice(index + bodyMismatchSeparator.length)),
    }))
    .find(
      ({ expected, received }) =>
        expected !== undefined && received !== undefined,
    )
}

const failOnUnmatchedRequests = () => {
  nock.emitter.on("no match", (request, interceptorResults = []) => {
    const reasons = interceptorResults.flatMap(({ reasons }) => reasons)
    const bodyMismatch = reasons.find(reason =>
      reason.startsWith(bodyMismatchPrefix),
    )
    const otherReasons = reasons.filter(reason => reason !== bodyMismatch)
    const message = [
      `Unmatched ${request.method} ${request.url}`,
      ...otherReasons,
    ].join("\n")
    const bodies = bodyMismatch && expectedAndReceivedBodies(bodyMismatch)
    if (bodies) {
      expect(bodies.received, message).toEqual(bodies.expected)
    }
    throw new Error(message)
  })
}

const failOnUnusedMockRequests = () => {
  afterEach(() => {
    expect(nock.pendingMocks()).toEqual([])
  })
}

const preventRequestTestPollution = () => {
  afterEach(() => {
    nock.cleanAll()
  })
}

const setupNock = () => {
  failOnUnmatchedRequests()
  failOnUnusedMockRequests()
  preventRequestTestPollution()
}

export default setupNock

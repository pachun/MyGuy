import nock from "nock"
import { afterEach, expect } from "vitest"

const failOnUnmatchedRequests = () => {
  nock.emitter.on("no match", (request, interceptorResults = []) => {
    const reasons = interceptorResults.flatMap(({ reasons }) => reasons)
    throw new Error(
      [`Unmatched ${request.method} ${request.url}`, ...reasons].join("\n"),
    )
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

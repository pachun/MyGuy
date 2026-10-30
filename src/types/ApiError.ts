export type ApiErrorBody = {
  type: "error"
  error: {
    type: string
    message: string
  }
}

export type ApiError = {
  status: number
  body: ApiErrorBody
}

import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/appError"
import { ZodError } from "zod"

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // Malformed JSON payloads from express.json() should be treated as bad requests.
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload"
    })
  }

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0].message
    })
  }

  // Custom app error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }

  console.error("UNEXPECTED ERROR:", err)
  if (err.stack) console.error("STACK TRACE:", err.stack)

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message, // Always send message for debugging
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  })
}
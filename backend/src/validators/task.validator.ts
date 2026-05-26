import { z } from "zod"

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  goalId: z.number(),
  focusMinutes: z.number().int().min(1).max(480).optional()
})

export const createTasksBulkSchema = z.object({
  goalId: z.number(),
  tasks: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      focusMinutes: z.number().int().min(1).max(480).optional()
    })
  ).min(1, "At least one task is required")
})

export const updateTaskSchema = z.object({
  completed: z.boolean().describe("Mark task as complete or incomplete")
})

// Validation helper for task IDs
export const taskIdSchema = z.number().int().positive("Invalid task ID")
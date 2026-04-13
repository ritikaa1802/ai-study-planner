import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    "BRAIN_GAINS",
    "MONEY_MOVES",
    "MAIN_CHARACTER_ENERGY",
    "COOKING_PROJECTS",
    "LOCK_IN_MODE",
  ]),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  type: z
    .enum([
      "BRAIN_GAINS",
      "MONEY_MOVES",
      "MAIN_CHARACTER_ENERGY",
      "COOKING_PROJECTS",
      "LOCK_IN_MODE",
    ])
    .optional(),
});

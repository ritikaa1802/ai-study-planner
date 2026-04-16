-- Non-destructive lifetime goals tracking migration
ALTER TABLE "goal"
ADD COLUMN IF NOT EXISTS "completionCounted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "lifetimeGoalsCompleted" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "lifetimeGoalsMissed" INTEGER NOT NULL DEFAULT 0;

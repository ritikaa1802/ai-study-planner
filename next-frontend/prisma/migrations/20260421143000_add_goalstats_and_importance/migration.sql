ALTER TABLE "goal"
ADD COLUMN IF NOT EXISTS "isImportant" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "goalstats" (
  "id" TEXT NOT NULL,
  "lifetimeGoalsCompleted" INTEGER NOT NULL DEFAULT 0,
  "lifetimeGoalsMissed" INTEGER NOT NULL DEFAULT 0,
  "lastRunDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goalstats_pkey" PRIMARY KEY ("id")
);

INSERT INTO "goalstats" ("id", "lifetimeGoalsCompleted", "lifetimeGoalsMissed")
SELECT 'global', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM "goalstats" WHERE "id" = 'global');

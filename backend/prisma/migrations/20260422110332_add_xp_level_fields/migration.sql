-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "calendarevent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "calendarevent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circlemessage" (
    "id" SERIAL NOT NULL,
    "circleId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circlemessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circleschedule" (
    "id" SERIAL NOT NULL,
    "circleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circleschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dailyactivity" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "dailyactivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyCircleId" INTEGER,
    "completedAt" TIMESTAMP(3),
    "completionCounted" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goalstats" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "lifetimeGoalsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lifetimeGoalsMissed" INTEGER NOT NULL DEFAULT 0,
    "lastRunDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goalstats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" INTEGER NOT NULL,
    "studyCircleId" INTEGER,
    "fileType" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessionparticipant" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPing" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "sessionparticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studycircle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studycircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studycirclemembership" (
    "id" SERIAL NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "studyCircleId" INTEGER NOT NULL,

    CONSTRAINT "studycirclemembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studysession" (
    "id" SERIAL NOT NULL,
    "circleId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL DEFAULT 25,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "studysession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "focusMinutes" INTEGER,
    "goalId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionCounted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshToken" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "passwordResetExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "notifs" JSONB,
    "deletedCompletedGoalsCount" INTEGER NOT NULL DEFAULT 0,
    "deletedCompletedGoalsDate" TIMESTAMP(3),
    "lifetimeGoalsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lifetimeGoalsMissed" INTEGER NOT NULL DEFAULT 0,
    "lifetimeTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "lifetimeTasksCreated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studysession_log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studysession_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_definitions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "achievement_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress_value" INTEGER NOT NULL DEFAULT 0,
    "level_unlocked" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendarevent_userId_idx" ON "calendarevent"("userId");

-- CreateIndex
CREATE INDEX "circlemessage_circleId_idx" ON "circlemessage"("circleId");

-- CreateIndex
CREATE INDEX "circlemessage_senderId_idx" ON "circlemessage"("senderId");

-- CreateIndex
CREATE INDEX "circleschedule_circleId_idx" ON "circleschedule"("circleId");

-- CreateIndex
CREATE INDEX "dailyactivity_userId_idx" ON "dailyactivity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dailyactivity_date_userId_key" ON "dailyactivity"("date", "userId");

-- CreateIndex
CREATE INDEX "goal_completedAt_idx" ON "goal"("completedAt");

-- CreateIndex
CREATE INDEX "goal_studyCircleId_idx" ON "goal"("studyCircleId");

-- CreateIndex
CREATE INDEX "goal_userId_idx" ON "goal"("userId");

-- CreateIndex
CREATE INDEX "resource_studyCircleId_idx" ON "resource"("studyCircleId");

-- CreateIndex
CREATE INDEX "resource_uploaderId_idx" ON "resource"("uploaderId");

-- CreateIndex
CREATE INDEX "sessionparticipant_userId_idx" ON "sessionparticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessionparticipant_sessionId_userId_key" ON "sessionparticipant"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "studycircle_inviteCode_key" ON "studycircle"("inviteCode");

-- CreateIndex
CREATE INDEX "studycirclemembership_studyCircleId_idx" ON "studycirclemembership"("studyCircleId");

-- CreateIndex
CREATE UNIQUE INDEX "studycirclemembership_userId_studyCircleId_key" ON "studycirclemembership"("userId", "studyCircleId");

-- CreateIndex
CREATE INDEX "studysession_circleId_idx" ON "studysession"("circleId");

-- CreateIndex
CREATE INDEX "task_goalId_idx" ON "task"("goalId");

-- CreateIndex
CREATE INDEX "task_userId_idx" ON "task"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "studysession_log_date_idx" ON "studysession_log"("date");

-- CreateIndex
CREATE INDEX "studysession_log_userId_idx" ON "studysession_log"("userId");

-- CreateIndex
CREATE INDEX "note_userId_idx" ON "note"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_definitions_key_key" ON "achievement_definitions"("key");

-- CreateIndex
CREATE INDEX "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "calendarevent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circlemessage" ADD CONSTRAINT "CircleMessage_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "studycircle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circlemessage" ADD CONSTRAINT "CircleMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circleschedule" ADD CONSTRAINT "CircleSchedule_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "studycircle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dailyactivity" ADD CONSTRAINT "DailyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "Goal_studyCircleId_fkey" FOREIGN KEY ("studyCircleId") REFERENCES "studycircle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "Resource_studyCircleId_fkey" FOREIGN KEY ("studyCircleId") REFERENCES "studycircle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "Resource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessionparticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "studysession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessionparticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studycirclemembership" ADD CONSTRAINT "StudyCircleMembership_studyCircleId_fkey" FOREIGN KEY ("studyCircleId") REFERENCES "studycircle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studycirclemembership" ADD CONSTRAINT "StudyCircleMembership_userId_fkey2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studysession" ADD CONSTRAINT "StudySession_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "studycircle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "Task_userId_fkey2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studysession_log" ADD CONSTRAINT "UserStudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "Note_userId_fkey2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

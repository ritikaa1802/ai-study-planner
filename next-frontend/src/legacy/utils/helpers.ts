import { Goal, Task, Theme } from "../types";

export function getGoalProgress(goal: Goal): number {
  if (!goal.tasks.length) return 0;
  return Math.round((goal.tasks.filter((t: Task) => t.done).length / goal.tasks.length) * 100);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getSarcasticThought(streak: number): string {
  const h = new Date().getHours();
  if (streak >= 20) return "23-day streak? Okay, we get it. You're better than us.";
  if (streak >= 10) return `${streak} days straight. Your future self is mildly impressed.`;
  if (streak >= 5) return `${streak} days in a row. Don't celebrate yet, it's still reversible.`;
  if (streak === 1) return "One day streak. Bold of you to call that a streak.";
  if (streak === 0) return "Zero streak. Even your alarm gave up on you.";
  if (h < 7) return "Studying before 7am? Either very dedicated or very confused.";
  if (h > 22) return "Still at it past 10pm? Sleep deprivation isn't a study strategy.";
  return "The plan is right there. Executing it is the hard part, apparently.";
}

export function formatTime(seconds: number): { mins: string; secs: string } {
  return {
    mins: String(Math.floor(seconds / 60)).padStart(2, "0"),
    secs: String(seconds % 60).padStart(2, "0"),
  };
}

export function getDotColor(count: number, C: Theme): string {
  if (count === 0) return C.dot0;
  if (count <= 1) return C.dot1;
  if (count <= 3) return C.dot2;
  if (count <= 5) return C.dot3;
  if (count <= 8) return C.dot4;
  return C.dot5;
}


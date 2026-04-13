export type Priority = "high" | "medium" | "low";

export interface PlannerTask {
  title: string;
  description: string;
  estimatedTime: string;
  priority: Priority;
}

export interface PlannerDay {
  day: string;
  tasks: PlannerTask[];
}

export interface PlannerWeek {
  week: number;
  focusArea: string;
  intensity: number;
  days: PlannerDay[];
}

export interface PlannerResponse {
  goalTitle: string;
  duration: string;
  weeks: PlannerWeek[];
}

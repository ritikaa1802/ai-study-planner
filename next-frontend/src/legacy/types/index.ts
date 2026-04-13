export interface Theme {
  sidebar: string;
  sidebarHover: string;
  sidebarActive: string;
  sidebarText: string;
  sidebarActiveText: string;
  accent: string;
  accentLight: string;
  accentBg: string;
  accentBar: string;
  bg: string;
  white: string;
  card: string;
  text: string;
  subtext: string;
  muted: string;
  border: string;
  inputBg: string;
  dot0: string;
  dot1: string;
  dot2: string;
  dot3: string;
  dot4: string;
  dot5: string;
  red: string;
  green: string;
  amber: string;
  orange: string;
  statNum: string;
}

export interface Task {
  id: number;
  text: string;
  done: boolean;
  focusMinutes?: number | null;
}

export interface Goal {
  id: number;
  title: string;
  type: GoalType;
  tasks: Task[];
}

export type GoalType =
  | "BRAIN_GAINS"
  | "MONEY_MOVES"
  | "MAIN_CHARACTER_ENERGY"
  | "COOKING_PROJECTS"
  | "LOCK_IN_MODE";

export interface GoalTypeMeta {
  key: GoalType;
  label: string;
  desc: string;
}

export interface GoalTypeColor {
  bg: string;
  color: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  tag: EventTag;
  time: string;
  date: string;
  day: number;
}

export type EventTag = "exam" | "study" | "deadline" | "presentation";

export interface Notification {
  id: number;
  text: string;
  time: string;
  unread: boolean;
}

export interface NavItem {
  key: string;
  icon: string;
}

export type PageKey =
  | "Dashboard"
  | "Goals"
  | "Calendar"
  | "Focus Mode"
  | "Analytics"
  | "AI Planner"
  | "Resources"
  | "Study Circle"
  | "Settings";

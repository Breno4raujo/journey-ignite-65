export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  totalModules: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  totalLessons: number;
  lessons?: string[];
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  completedLessons: number;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
}

export type PaceMode = "leve" | "focado" | "intenso";

export type StudyActivityKind = "lesson" | "module" | "time";

export interface StudyActivity {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string;
  kind: StudyActivityKind;
  lessonNumber?: number;
  seconds?: number;
  createdAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string;
  durationMinutes: number;
  remainingSeconds: number;
  notes: string;
  startedAt: Date;
  updatedAt: Date;
}

export interface ModuleProgressView {
  module: Module;
  completedLessons: number;
  percent: number;
  isCompleted: boolean;
  lastAccessedAt: Date | null;
}

export type BadgeIcon =
  | "weekend"
  | "early"
  | "comeback"
  | "consistency"
  | "firstStep"
  | "nightOwl"
  | "lunchBreak"
  | "explorer"
  | "halfway"
  | "finisher"
  | "marathon"
  | "quickWin"
  | "weekStreak"
  | "monthIn"
  | "focus"
  | "curiosity"
  | "courage"
  | "balance"
  | "rebuild"
  | "spark"
  | "pace"
  | "deepDive"
  | "milestone25"
  | "milestone50"
  | "milestone75";

export interface SoftSkillBadge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  icon: BadgeIcon;
}

export interface WeeklyEnergySummary {
  current: number;
  goal: number;
  studiedMinutes: number;
  completedLessons: number;
  completedModules: number;
  rhythmDeltaPercent: number;
  message: string;
}

export interface ProgressSummary {
  course: Course;
  overallPercent: number;
  totalLessons: number;
  completedLessons: number;
  modules: ModuleProgressView[];
  estimatedWeeksRemaining: number;
  pace: PaceMode;
  paceHoursPerWeek: number;
  encouragement: string;
  resumeContext: {
    courseId: string;
    moduleId: string;
    moduleTitle: string;
    lessonNumber: number;
    daysSince: number;
  } | null;
  weeklyEnergy: WeeklyEnergySummary;
  badges: SoftSkillBadge[];
}

export interface Victory {
  id: string;
  kind: "module" | "milestone" | "badge";
  title: string;
  message: string;
  earnedAt: Date;
}

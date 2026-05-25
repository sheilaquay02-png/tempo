export type TempoSource = "tempo" | "google" | "habit";

export interface TempoEvent {
  id: string;
  title: string;
  start: Date | string | { __d: string };
  end: Date | string | { __d: string };
  calendar?: string;
  category?: string;
  fixed?: boolean;
  color?: string | null;
  notes?: string;
  recurrence?: TempoRecurrence | string | null;
  allDay?: boolean;
  source?: TempoSource;
  readOnly?: boolean;
  deletedAt?: string | null;
}

export interface TempoTask {
  id: string;
  title: string;
  duration?: number;
  category?: string;
  scope?: "day" | "week" | "month";
  done?: boolean;
  priority?: "high" | "medium" | "low";
  taskDate?: string | null;
  dayKey?: string | null;
  weekKey?: string | null;
  monthKey?: string | null;
  recurrence?: TempoRecurrence | string | null;
  deletedAt?: string | null;
}

export interface TempoRecurrence {
  frequency?: "daily" | "weekly" | "weekdays" | "monthly";
  interval?: number;
  count?: number;
  until?: string;
  endDate?: string;
  byWeekdays?: number[];
  byMonthDay?: number;
  skippedDates?: string[];
  exceptions?: string[];
}

export interface TempoMemoryPhoto {
  id: string;
  storagePath?: string;
  thumbStoragePath?: string;
  bucket?: string;
  caption?: string;
  name?: string;
  createdAt?: string;
}

export interface TempoMemoryEntry {
  mood?: string | null;
  activities?: string[];
  note?: string;
  gratitude?: string[];
  photos?: TempoMemoryPhoto[];
  tags?: string[];
  backgroundId?: string;
  highlights?: Record<string, string>;
  blocks?: unknown[];
  updatedAt?: string | null;
}

export interface TempoUserData {
  events: TempoEvent[];
  tasks: TempoTask[];
  settings: Record<string, unknown>;
}

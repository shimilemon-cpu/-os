export type PlayCategory =
  | "すべて"
  | "ひとり"
  | "友達と"
  | "カップルで"
  | "家で"
  | "外で";

export interface PlayReport {
  nickname: string;
  comment: string;
  image?: string;
}

export interface PlayTemplate {
  id: string;
  title: string;
  tagline: string;
  description: string;
  primaryCategory: Exclude<PlayCategory, "すべて">;
  tags: string[];
  durationLabel: string;
  peopleLabel: string;
  stuff: string[];
  steps: string[];
  gradient: string;
  emoji: string;
  doCount: number;
  reports: PlayReport[];
}

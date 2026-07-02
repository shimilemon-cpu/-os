import type { Timestamp } from "firebase/firestore";

// ─── ユーザー ───────────────────────────────────────────────
export interface UserDoc {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: Timestamp | null;
}

// ─── ルーム ────────────────────────────────────────────────
export type RoomMode = "realtime" | "async";
export type RoomStatus = "waiting" | "active" | "finished";

export type TopicMode = "omakase" | "custom" | "mochiyori";

export interface RoomDoc {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string;
  mode: RoomMode;
  topicMode: TopicMode;
  status: RoomStatus;
  capacity: number;          // default 5 for backward compat
  memberIds: string[];       // max capacity
  judges?: AiPersona[];     // undefined → ["王道", "辛口"]
  createdAt: Timestamp | null;
}

export interface RoomMemberDoc {
  userId: string;
  nickname: string;
  isReady: boolean;
  joinedAt: Timestamp | null;
}

export interface InviteCodeDoc {
  roomId: string;
  createdAt: Timestamp | null;
}

// ─── セッション（1プレイ） ────────────────────────────────────
export type SessionStatus = "answering" | "voting" | "reviewing" | "finished";

export interface SessionDoc {
  id: string;
  roomId: string;
  currentRound: number;
  totalRounds: number;
  status: SessionStatus;
  answerDeadline: Timestamp | null;
  voteDeadline: Timestamp | null;
  createdAt: Timestamp | null;
}

// ─── ラウンド ──────────────────────────────────────────────
export type RoundStatus = "answering" | "voting" | "reviewing" | "done";
export type Difficulty = "初級" | "中級" | "上級";
export type Genre = "日常" | "恋愛" | "仕事" | "カオス" | "その他";

export interface RoundDoc {
  id: string;
  question: {
    text: string;
    genre: Genre;
    difficulty: Difficulty;
    imageUrl?: string | null;
  };
  status: RoundStatus;
  answerCount: number;
  startedAt: Timestamp | null;
  answerDeadline: Timestamp | null;
  voteDeadline: Timestamp | null;
}

// ─── 回答 ──────────────────────────────────────────────────
export interface AnswerDoc {
  id: string;
  userId: string;
  displayOrder: number;      // シャッフル済み表示順（投票画面用）
  text: string;
  submittedAt: Timestamp | null;
}

// ─── 投票 ──────────────────────────────────────────────────
export type Reaction = "funny" | "smart" | "crazy";

export interface VoteDoc {
  id: string;
  answerId: string;
  voterId: string;
  reaction: Reaction;
  createdAt: Timestamp | null;
}

// ─── AI講評 ────────────────────────────────────────────────
export type AiPersona = "王道" | "辛口";

export interface AiReviewDoc {
  id: string;
  answerId: string;
  persona: AiPersona;
  score: number;             // 0〜100
  comment: string;
  createdAt: Timestamp | null;
}

export interface AiAnalysisResult {
  userId: string;
  nickname: string;
  tendency: string;          // "シュール系", "ボケ系" など
  comment: string;           // "ちょっと●●に寄った回答するね！"
}

// ─── グループ統計（学習データ） ────────────────────────────────
export interface GroupStatsDoc {
  genrePrefs: Record<Genre, number>;
  reactionDist: Record<Reaction, number>;
  playCount: number;
  updatedAt: Timestamp | null;
}

// ─── 殿堂入り ──────────────────────────────────────────────
export interface HallOfFameDoc {
  id: string;
  text: string;
  authorNickname: string;
  roundLabel: string;
  reactions: Record<Reaction, number>;
  createdAt: Timestamp | null;
}

// ─── 問題バンク ────────────────────────────────────────────
export interface QuestionBankDoc {
  id: string;
  text: string;
  genre: Genre;
  difficulty: Difficulty;
  usedAt: Timestamp | null;
  createdAt: Timestamp;
}

// ─── 縁側（コミュニティスペース） ──────────────────────────
export interface EngawaPostDoc {
  id: string;
  question: { text: string; genre: Genre; difficulty: Difficulty };
  publishedAt: Timestamp;
  sessionId: string;
  roundId: string;
  answerCount: number;
}

export interface EngawaAnswerDoc {
  id: string;
  text: string;
  userId: string | null;
  createdAt: Timestamp;
}

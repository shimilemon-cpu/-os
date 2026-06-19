import type { User } from "firebase/auth";

// モデレーション権限（全投稿の編集・非表示・削除）を持つ管理者のメールアドレス。
// Googleログインのメールで判定する。ここに追加すれば管理者を増やせる。
export const ADMIN_EMAILS = ["shimilemon@gmail.com"];

export function isAdmin(user: User | null | undefined): boolean {
  const email = user?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.includes(email);
}

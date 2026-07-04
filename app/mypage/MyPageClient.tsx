"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { tallyVotes } from "@/lib/ogiri/sessions";
import type { UserDoc, VoteDoc, AnswerDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";
import ProfileEditSheet from "./ProfileEditSheet";

type EngimonoName = "daruma" | "cat" | "tai" | "fuku" | "koban" | "mallet" | "mask" | "tanuki" | "kitsune" | "usagi";
const ALL_ICONS: EngimonoName[] = [
  "daruma", "cat", "tai", "fuku", "koban",
  "mallet", "mask", "tanuki", "kitsune", "usagi",
];

function StatsSkeleton() {
  return (
    <div
      className="mx-[20px] mb-[20px] bg-white flex animate-pulse"
      style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: "18px 8px", height: 76 }}
    />
  );
}

export default function MyPageClient() {
  const router = useRouter();
  const [cachedNickname, setCachedNickname] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [stats, setStats] = useState({ rooms: 0, zabuton: 0, taisho: 0 });
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    setCachedNickname(localStorage.getItem("ogiri_nickname"));
  }, []);

  useEffect(() => {
    auth.authStateReady().then(async () => {
      const user = auth.currentUser;
      if (!user) { router.push("/auth/login"); return; }

      const [profileSnap, roomsSnap] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDocs(query(collection(db, "rooms"), where("memberIds", "array-contains", user.uid))),
      ]);
      if (profileSnap.exists()) {
        setProfile({ id: user.uid, ...profileSnap.data() } as UserDoc);
      }

      let zabuton = 0;
      let taisho = 0;
      const sessionsSnap = await getDocs(query(collection(db, "sessions"), where("roomId", "in", roomsSnap.docs.map((d) => d.id).slice(0, 30))));
      for (const sess of sessionsSnap.docs) {
        const roundsSnap = await getDocs(collection(db, "sessions", sess.id, "rounds"));
        for (const rd of roundsSnap.docs) {
          const [answersSnap, votesSnap] = await Promise.all([
            getDocs(collection(db, "sessions", sess.id, "rounds", rd.id, "answers")),
            getDocs(collection(db, "sessions", sess.id, "rounds", rd.id, "votes")),
          ]);
          const answers = answersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AnswerDoc));
          const votes = votesSnap.docs.map((d) => d.data() as VoteDoc);
          const tally = tallyVotes(votes);
          const myAnswers = answers.filter((a) => a.userId === user.uid);
          for (const a of myAnswers) zabuton += tally[a.id]?.total ?? 0;
          if (answers.length > 0) {
            const sorted = [...answers].sort((a, b) => (tally[b.id]?.total ?? 0) - (tally[a.id]?.total ?? 0));
            if (sorted[0]?.userId === user.uid) taisho++;
          }
        }
      }
      setStats({ rooms: roomsSnap.size, zabuton, taisho });
      setLoading(false);
    });
  }, [router]);

  const user = auth.currentUser;
  const nickname = profile?.nickname ?? cachedNickname ?? user?.displayName ?? "ゲスト";
  const avatarIcon = (profile?.avatarIcon as EngimonoName | null) ?? "fuku";
  const avatarUrl = profile?.avatarUrl ?? null;

  const handleSaved = useCallback((data: { nickname: string; avatarIcon: EngimonoName | null; avatarUrl: string | null }) => {
    setProfile((prev) => prev ? { ...prev, nickname: data.nickname, avatarIcon: data.avatarIcon, avatarUrl: data.avatarUrl } : prev);
    setShowEdit(false);
  }, []);

  return (
    <>
      {/* Avatar */}
      <div style={{ padding: "0 20px 24px" }}>
        <div className="flex flex-col items-center gap-[10px]">
          <div className="relative" style={{ width: 88, height: 88 }}>
            <div
              className="grid place-items-center overflow-hidden"
              style={{ width: 88, height: 88, background: "#F0EBE0", border: "3px solid #2BA35F", borderRadius: "50%" }}
            >
              {avatarIcon && !avatarUrl ? (
                <Engimono name={avatarIcon} width={48} height={52} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Engimono name="fuku" width={48} height={52} />
              )}
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="absolute grid place-items-center"
              style={{ bottom: -2, right: -2, width: 28, height: 28, background: "#E5402F", border: "2px solid #FBF7EC", borderRadius: "50%" }}
            >
              <Icon name="pencil" size={12} color="#FBF7EC" strokeWidth={1.5} />
            </button>
          </div>
          <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 18 }}>{nickname}</p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div
          className="mx-[20px] mb-[20px] bg-white flex"
          style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: "18px 8px", boxShadow: "0 2px 8px rgba(40,30,10,.04)" }}
        >
          <div className="flex-1 text-center" style={{ borderRight: "1px solid rgba(0,0,0,.05)" }}>
            <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>{stats.rooms}</p>
            <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>参加回数</p>
          </div>
          <div className="flex-1 text-center" style={{ borderRight: "1px solid rgba(0,0,0,.05)" }}>
            <p className="font-mincho font-extrabold" style={{ fontSize: 24, color: "#E5402F" }}>{stats.zabuton}</p>
            <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>座布団</p>
          </div>
          <div className="flex-1 text-center">
            <p className="font-mincho font-extrabold" style={{ fontSize: 24, color: "#F4C422" }}>{stats.taisho}</p>
            <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>大賞</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-[20px] flex-1 flex flex-col gap-[8px]">
        {/* Avatar collection */}
        <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14, marginBottom: 4 }}>アバターコレクション</p>
        <div
          className="bg-white mb-[8px]"
          style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: 16 }}
        >
          <div className="flex gap-[10px] flex-wrap">
            {ALL_ICONS.map((name) => (
              <div
                key={name}
                className="grid place-items-center"
                style={{
                  width: 48, height: 48, background: "#F0EBE0", borderRadius: "50%",
                  border: name === avatarIcon ? "2px solid #2BA35F" : "2px solid transparent",
                }}
              >
                <Engimono name={name} width={26} height={28} />
              </div>
            ))}
          </div>
        </div>

        {/* Settings menu */}
        <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14, marginBottom: 4, marginTop: 8 }}>設定</p>
        <div
          className="bg-white overflow-hidden"
          style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)" }}
        >
          {["プロフィール編集", "対戦履歴", "通知設定"].map((label, i, arr) => (
            <button
              key={label}
              onClick={label === "プロフィール編集" ? () => setShowEdit(true) : undefined}
              className="w-full flex items-center justify-between px-[16px] font-gothic font-semibold text-[#1A1714]"
              style={{
                padding: 16, fontSize: 14, cursor: "pointer",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,.04)" : "none",
                background: "transparent",
              }}
            >
              <span>{label}</span>
              <Icon name="chevron" size={16} color="#B6AC97" strokeWidth={2} />
            </button>
          ))}
        </div>

        {/* Auth info + Logout */}
        <div className="mt-4 mb-6">
          <p className="font-gothic text-sub mb-2" style={{ fontSize: 11 }}>
            {user?.uid?.startsWith("line_") ? "LINEアカウントでログイン中" : "ゲストとしてログイン中"}
          </p>
          <button
            onClick={async () => {
              localStorage.removeItem("ogiri_nickname");
              await signOut(auth);
              router.push("/auth/login");
            }}
            className="w-full font-gothic font-semibold active:scale-[0.98] transition-transform"
            style={{
              fontSize: 14, padding: "14px 0",
              borderRadius: 18,
              border: "1.5px solid rgba(0,0,0,.1)",
              color: "#E5402F",
              background: "transparent",
            }}
          >
            ログアウト
          </button>
          {!user?.uid?.startsWith("line_") && (
            <p className="font-gothic text-sub text-center mt-2" style={{ fontSize: 11 }}>
              LINEでログインし直すと、どの端末でも同じアカウントで遊べます
            </p>
          )}
        </div>
      </div>

      {/* Edit sheet */}
      {showEdit && user && (
        <ProfileEditSheet
          uid={user.uid}
          initialNickname={nickname}
          initialAvatarIcon={avatarIcon}
          initialAvatarUrl={avatarUrl}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

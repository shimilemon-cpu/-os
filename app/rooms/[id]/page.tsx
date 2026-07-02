"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeRoom, subscribeMembers, setMemberReady, startGame } from "@/lib/ogiri/rooms";
import { createSession, createRound, getActiveSession } from "@/lib/ogiri/sessions";
import { validatePhoto, uploadRoomPhoto } from "@/lib/ogiri/photos";
import type { RoomDoc, RoomMemberDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import OdaiSheet from "@/components/OdaiSheet";

type QuestionData = { question: string; genre: string; difficulty: string };

function prefetchQuestion(): Promise<QuestionData> {
  return fetch("/api/ogiri/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((r) => r.json() as Promise<QuestionData>);
}

const ANSWER_SECONDS = 90;
const CHARM_NAMES = ["daruma", "cat", "tai", "fuku", "mask"] as const;
const CHARM_BG = ["#FCE8E3", "#EAF7EF", "#FDEFE0", "#FFF3D6", "#E8F0FC"] as const;

export default function WaitingRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [members, setMembers] = useState<RoomMemberDoc[]>([]);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uid, setUid] = useState(auth.currentUser?.uid ?? "");
  const prefetchRef = useRef<Promise<QuestionData> | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setUid(user?.uid ?? ""));
  }, []);

  useEffect(() => {
    const unsub1 = subscribeRoom(roomId, (r) => {
      setRoom(r);
      if (r.status === "active") {
        getActiveSession(roomId).then((session) => {
          if (session) router.push(`/rooms/${roomId}/game?sid=${session.id}`);
        });
      }
    });
    const unsub2 = subscribeMembers(roomId, setMembers);
    return () => { unsub1(); unsub2(); };
  }, [roomId, router]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validatePhoto(file);
    if (err) { setPhotoError(err); return; }
    setPhotoError("");
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const copyInvite = async () => {
    if (!room) return;
    const link = `${window.location.origin}/invite/${room.inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = () => {
    const me = members.find((m) => m.userId === uid);
    if (me) setMemberReady(roomId, uid, !me.isReady);
  };

  const handleStart = useCallback(async () => {
    if (!room) return;
    const isMochiyori = room.topicMode === "mochiyori";
    if (isMochiyori && !photoFile) return;
    setStarting(true);
    try {
      const sessionId = await createSession(roomId, 5);
      if (isMochiyori && photoFile) {
        setUploading(true);
        const imageUrl = await uploadRoomPhoto(roomId, 1, photoFile);
        setUploading(false);
        await createRound(sessionId, 1, {
          text: photoCaption || "この写真で一言",
          genre: "その他" as never,
          difficulty: "中級" as never,
          imageUrl,
        }, ANSWER_SECONDS);
      } else {
        const data = await (prefetchRef.current ?? prefetchQuestion());
        await createRound(sessionId, 1, {
          text: data.question,
          genre: data.genre as never,
          difficulty: data.difficulty as never,
        }, ANSWER_SECONDS);
        prefetchRef.current = null;
      }
      await startGame(roomId);
      router.push(`/rooms/${roomId}/game?sid=${sessionId}`);
    } catch (e) {
      console.error(e);
      prefetchRef.current = null;
      setStarting(false);
      setUploading(false);
    }
  }, [room, roomId, router, photoFile, photoCaption]);

  const isHost = room?.hostId === uid;
  const me = members.find((m) => m.userId === uid);

  useEffect(() => {
    if (isHost && !prefetchRef.current) {
      prefetchRef.current = prefetchQuestion();
    }
  }, [isHost]);

  const allReady = members.length >= 2 && members.every((m) => m.isReady || m.userId === uid);
  const readyCount = members.filter((m) => m.isReady).length;

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha pb-[20px]">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[10px] flex items-center gap-[12px]">
        <div className="flex-1">
          <div className="inline-flex items-center gap-[6px] mb-1">
            <span
              className="font-gothic font-extrabold"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: room.mode === "async" ? "#EBE2CF" : "#FCE7E3", color: room.mode === "async" ? "#7A6F5C" : "#E5402F" }}
            >
              {room.mode === "async" ? "⏰ 非同期" : "⚡ リアルタイム"}
            </span>
            <span className="font-gothic text-sub" style={{ fontSize: 10 }}>{members.length}/{room.capacity ?? 5}人</span>
          </div>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22, lineHeight: 1.1 }}>{room.name}</p>
        </div>
        <Engimono name="mallet" width={44} height={44} style={{ opacity: 0.9 }} />
      </div>

      {/* あいことばカード */}
      <div className="mx-[20px] mb-[14px] relative">
        <div
          className="relative overflow-hidden"
          style={{ borderRadius: 20, padding: "16px 18px 14px", background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)", border: "1.5px dashed #E0A93B" }}
        >
          <Engimono name="koban" width={20} height={30} style={{ position: "absolute", top: 10, right: 12, opacity: 0.7 }} />
          <p className="font-gothic font-extrabold text-[#9A6410]" style={{ fontSize: 10, letterSpacing: "0.14em" }}>＼ あいことばで招待 ／</p>
          <p
            className="font-mincho font-extrabold text-center tracking-[0.4em] mt-1 mb-2"
            style={{ fontSize: 36, color: "#E5402F", textShadow: "0 2px 0 rgba(229,64,47,.15)" }}
          >
            {room.inviteCode}
          </p>
          <button
            onClick={copyInvite}
            className="w-full flex items-center justify-center gap-2 font-gothic font-bold active:scale-95 transition-transform"
            style={{
              fontSize: 12, padding: "9px 0", borderRadius: 10,
              border: "1px solid rgba(0,0,0,.1)",
              color: copied ? "#2BA35F" : "#1A1714",
              background: "rgba(255,255,255,.7)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {copied ? <path d="M5 13l5 5L19 6"/> : <><rect x="4" y="4" width="11" height="11" rx="2.5"/><rect x="9" y="9" width="11" height="11" rx="2.5"/></>}
            </svg>
            {copied ? "コピーしました！" : "招待リンクをコピー"}
          </button>
        </div>
      </div>

      {/* メンバーリスト */}
      <div className="px-[20px] flex flex-col gap-[7px] mb-[14px]">
        <div className="flex items-center gap-[8px]">
          <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
          <p className="font-mincho font-extrabold text-sub" style={{ fontSize: 11, letterSpacing: "0.16em" }}>
            ◆ メンバー {members.length}/{room.capacity ?? 5} ・ 準備完了 {readyCount}人
          </p>
          <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
        </div>
        {members.map((m, i) => (
          <div
            key={m.userId}
            className="bg-white flex items-center gap-[12px] animate-rise"
            style={{ borderRadius: 15, padding: "11px 14px", border: "1px solid rgba(0,0,0,.07)" }}
          >
            <div
              className="shrink-0 grid place-items-center"
              style={{ width: 38, height: 38, borderRadius: 13, background: CHARM_BG[i % CHARM_BG.length] }}
            >
              <Engimono name={CHARM_NAMES[i % CHARM_NAMES.length]} width={28} height={31} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14 }}>{m.nickname}</p>
              {m.userId === room.hostId && (
                <span className="font-gothic font-extrabold" style={{ fontSize: 10, color: "#E0A93B" }}>ホスト</span>
              )}
            </div>
            <span
              className="font-gothic font-extrabold shrink-0"
              style={{ fontSize: 12, color: m.isReady ? "#2BA35F" : "#B6AC97" }}
            >
              {m.isReady ? "✓ 準備OK" : "待機中"}
            </span>
          </div>
        ))}
      </div>

      {/* 持ち寄りお題アップロード */}
      {room.topicMode === "mochiyori" && isHost && (
        <div className="mx-[20px] mb-[14px]">
          <div className="flex items-center gap-[8px] mb-[8px]">
            <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
            <p className="font-mincho font-extrabold text-sub" style={{ fontSize: 11, letterSpacing: "0.16em" }}>
              ◆ お題の写真を選ぶ
            </p>
            <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          {photoPreview ? (
            <div className="space-y-[10px] animate-rise">
              <OdaiSheet imageUrl={photoPreview} text={photoCaption || "この写真で一言"} roundNumber={1} />
              <input
                className="w-full bg-white font-gothic font-bold text-[#1A1714] outline-none"
                style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "11px 14px", fontSize: 14 }}
                placeholder="お題テキスト（任意）例：この写真で一言"
                maxLength={30}
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
              />
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoCaption(""); }}
                className="w-full font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
                style={{ fontSize: 12, padding: "8px 0", borderRadius: 12, border: "1px solid rgba(0,0,0,.1)" }}
              >
                写真を変更
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-[8px] active:scale-[0.98] transition-transform"
              style={{
                borderRadius: 18,
                padding: "24px 16px",
                border: "2px dashed #E0A93B",
                background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E0A93B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="font-gothic font-extrabold text-[#9A6410]" style={{ fontSize: 13 }}>
                写真を選ぶ
              </p>
              <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
                カメラロールからお題の写真をアップロード
              </p>
            </button>
          )}
          {photoError && <p className="font-gothic text-red mt-1" style={{ fontSize: 11 }}>{photoError}</p>}
        </div>
      )}

      {/* アクションボタン */}
      <div className="px-[20px] flex flex-col gap-[10px] mt-auto">
        {!isHost && (
          <button
            onClick={toggleReady}
            className="w-full font-mincho font-extrabold active:scale-[0.98] transition-all"
            style={{
              fontSize: 17, padding: "16px 0", borderRadius: 18,
              ...(me?.isReady
                ? { background: "#fff", border: "1px solid rgba(0,0,0,.1)", color: "#7A6F5C" }
                : { background: "#E6F5EC", border: "2px solid #2BA35F", color: "#2BA35F" }),
            }}
          >
            {me?.isReady ? "準備を取り消す" : "準備完了！"}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={members.length < 2 || !allReady || starting || (room.topicMode === "mochiyori" && !photoFile)}
            className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.6)" }}
          >
            {uploading
              ? "写真をアップロード中…"
              : starting
              ? "お題を生成中…"
              : members.length < 2
              ? "あと1人招待してください"
              : room.topicMode === "mochiyori" && !photoFile
              ? "お題の写真を選んでください"
              : !allReady
              ? `全員の準備を待っています (${readyCount}/${members.length})`
              : "大喜利、始め！"}
          </button>
        )}
      </div>
    </div>
  );
}

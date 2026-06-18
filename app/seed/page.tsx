"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { searchMusic, type ItunesTrack } from "@/lib/itunes";

// 各年代を代表する名曲に紐づけたデモカプセル（投稿者の属性もバラバラにして
// 「年代フィルター」「同世代」の雰囲気が確認できるようにしてある）
interface Demo {
  nickname: string;
  birthYear: number;
  gender: string;
  memoryText: string;
  memoryYear: number;
  lifeStage: string;
  songQuery: string;
  expectArtist: string;
  expectTitle: string;
  views: number;
}

const DEMOS: Demo[] = [
  {
    nickname: "カズ",
    birthYear: 1964,
    gender: "男性",
    memoryText:
      "バイト帰り、終電を待つホームで先輩とよく聴いた。あの頃の夜風と、缶コーヒーの温かさを今でも思い出す。",
    memoryYear: 1983,
    lifeStage: "大学2年・19歳の秋",
    songQuery: "安全地帯 ワインレッドの心",
    expectArtist: "安全地帯",
    expectTitle: "ワインレッドの心",
    views: 1840,
  },
  {
    nickname: "みーちゃん",
    birthYear: 1980,
    gender: "女性",
    memoryText:
      "自転車の後ろに友達を乗せて、河川敷をどこまでも走った夏。意味もなく笑えた、あの放課後が宝物だった。",
    memoryYear: 1995,
    lifeStage: "中学3年の夏休み",
    songQuery: "スピッツ ロビンソン",
    expectArtist: "スピッツ",
    expectTitle: "ロビンソン",
    views: 4210,
  },
  {
    nickname: "ゆき",
    birthYear: 1984,
    gender: "女性",
    memoryText:
      "初めて自分で買ったCD。何度も巻き戻して歌詞を覚えた。片想いだったあの人を思いながら、夜中に布団で泣いた。",
    memoryYear: 2000,
    lifeStage: "高校1年・初恋の頃",
    songQuery: "宇多田ヒカル First Love",
    expectArtist: "宇多田ヒカル",
    expectTitle: "First Love",
    views: 5630,
  },
  {
    nickname: "たく",
    birthYear: 1987,
    gender: "男性",
    memoryText:
      "受験前の冬、塾の帰り道に雪が降ってきた。白い息を吐きながら、これからの自分を初めて真剣に考えた夜。",
    memoryYear: 2005,
    lifeStage: "高校3年・受験生の冬",
    songQuery: "レミオロメン 粉雪",
    expectArtist: "レミオロメン",
    expectTitle: "粉雪",
    views: 3290,
  },
  {
    nickname: "のぞみ",
    birthYear: 1990,
    gender: "女性",
    memoryText:
      "祖母の葬式の帰り、車のラジオから流れてきた。涙が止まらなくて、窓の外の景色がずっとにじんでいた。",
    memoryYear: 2018,
    lifeStage: "社会人3年目の春",
    songQuery: "米津玄師 Lemon",
    expectArtist: "米津玄師",
    expectTitle: "Lemon",
    views: 8120,
  },
  {
    nickname: "レン",
    birthYear: 2001,
    gender: "男性",
    memoryText:
      "外に出られなかったあの年。イヤホンでこの曲ばかり聴いて、いつか皆で騒げる日を信じて部屋で踊ってた。",
    memoryYear: 2020,
    lifeStage: "大学1年・2020年の春",
    songQuery: "YOASOBI 夜に駆ける",
    expectArtist: "YOASOBI",
    expectTitle: "夜に駆ける",
    views: 6750,
  },
];

type Status = "pending" | "running" | "done" | "error";

// iTunes検索結果から、ライブ盤やカラオケを避けて一番それらしい曲を選ぶ
function pickTrack(results: ItunesTrack[], demo: Demo): ItunesTrack | null {
  if (results.length === 0) return null;
  const ng = /(live|カラオケ|cover|instrumental|オルゴール|tribute)/i;
  const clean = results.filter(
    (t) => !ng.test(t.trackName) && !ng.test(t.collectionName ?? "")
  );
  const pool = clean.length > 0 ? clean : results;
  const exact = pool.find(
    (t) =>
      t.artistName.includes(demo.expectArtist) &&
      t.trackName.toLowerCase().includes(demo.expectTitle.toLowerCase())
  );
  return exact ?? pool[0];
}

export default function SeedPage() {
  const [statuses, setStatuses] = useState<Status[]>(DEMOS.map(() => "pending"));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const setStatus = (i: number, s: Status) =>
    setStatuses((prev) => prev.map((v, idx) => (idx === i ? s : v)));

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const seedOne = async (demo: Demo, i: number) => {
    setStatus(i, "running");

    // 1. iTunes から実際の試聴音源・ジャケットを取得
    let track: ItunesTrack | null = null;
    try {
      track = pickTrack(await searchMusic(demo.songQuery), demo);
    } catch {
      track = null;
    }

    // 2. AI画像を4枚生成
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memoryText: demo.memoryText,
        memoryYear: String(demo.memoryYear),
        lifeStage: demo.lifeStage,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "画像生成に失敗");

    // 3. 本番の投稿と同じ形式で Firestore に保存
    const user = auth.currentUser;
    if (!user) throw new Error("ログインが必要です");
    await addDoc(collection(db, "capsules"), {
      userId: user.uid,
      userNickname: demo.nickname,
      userBirthYear: demo.birthYear,
      userGender: demo.gender,
      memoryText: demo.memoryText,
      memoryYear: demo.memoryYear,
      lifeStage: demo.lifeStage,
      youtubeVideoId: null,
      youtubeStart: null,
      songTitle: track?.trackName ?? demo.expectTitle,
      artistName: track?.artistName ?? demo.expectArtist,
      previewUrl: track?.previewUrl ?? null,
      artworkUrl: track?.artworkUrl100 ?? null,
      images: json.images,
      views: demo.views,
      status: "published",
      createdAt: serverTimestamp(),
    });
  };

  const runAll = async () => {
    if (running) return;
    if (!auth.currentUser) {
      addLog("⚠ ログインしてから実行してください");
      return;
    }
    setRunning(true);
    setFinished(false);
    for (let i = 0; i < DEMOS.length; i++) {
      try {
        await seedOne(DEMOS[i], i);
        setStatus(i, "done");
        addLog(`✓ ${DEMOS[i].songQuery} を作成しました`);
      } catch (e) {
        setStatus(i, "error");
        addLog(`✗ ${DEMOS[i].songQuery}：${e instanceof Error ? e.message : "失敗"}`);
      }
    }
    setRunning(false);
    setFinished(true);
  };

  const doneCount = statuses.filter((s) => s === "done").length;

  return (
    <div className="pb-24 min-h-screen">
      <div className="sticky top-0 z-40 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href="/" className="text-[#b899a8]"><ArrowLeft size={20} /></Link>
          <span className="text-[#ede0e8] text-sm font-medium">デモを作成</span>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-[#ede0e8] text-base font-medium">サンプルのカプセルを6件作ります</h2>
          <p className="text-[#7a6475] text-xs leading-relaxed">
            各年代の名曲に紐づいたデモ投稿を、本物のAI画像つきで作成します。3〜5分ほどかかります。途中で画面を閉じないでください。
          </p>
        </div>

        <button
          onClick={runAll}
          disabled={running || finished}
          className="w-full flex items-center justify-center gap-2 bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold py-3.5 rounded-full disabled:opacity-40"
        >
          {running ? (
            <><Loader2 size={16} className="animate-spin" />作成中…（{doneCount}/{DEMOS.length}）</>
          ) : finished ? (
            <><CheckCircle size={16} />完了しました</>
          ) : (
            <><Sparkles size={16} />デモを6件作成する</>
          )}
        </button>

        <div className="space-y-2">
          {DEMOS.map((demo, i) => {
            const s = statuses[i];
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1520] border border-[#2d1e30]">
                <div className="shrink-0">
                  {s === "running" && <Loader2 size={16} className="text-[#c48a9f] animate-spin" />}
                  {s === "done" && <CheckCircle size={16} className="text-[#7ec48a]" />}
                  {s === "error" && <XCircle size={16} className="text-[#c4727f]" />}
                  {s === "pending" && <div className="w-4 h-4 rounded-full border border-[#2d1e30]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#ede0e8] text-xs font-medium truncate">{demo.expectTitle} / {demo.expectArtist}</p>
                  <p className="text-[#7a6475] text-[10px] truncate">{demo.memoryYear}年・{demo.lifeStage}</p>
                </div>
              </div>
            );
          })}
        </div>

        {finished && (
          <Link href="/" className="block text-center bg-[#221928] border border-[#2d1e30] text-[#ede0e8] text-sm py-3 rounded-full">
            ホームで確認する
          </Link>
        )}

        {log.length > 0 && (
          <div className="space-y-1 pt-2">
            {log.map((l, i) => (
              <p key={i} className="text-[#7a6475] text-[10px] font-mono">{l}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

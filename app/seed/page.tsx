"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Sparkles, Sun } from "lucide-react";
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

// 各年代の名曲（しっとり〜切ない記憶も含む標準セット）
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

// 明るく前向きな記憶 × アップテンポな名曲のセット。
// AIが「bright」ムードを検出して、晴れた鮮やかな画像が生成されることを確認できる。
const BRIGHT_DEMOS: Demo[] = [
  {
    nickname: "ヒロ",
    birthYear: 1968,
    gender: "男性",
    memoryText:
      "友達3人で原付飛ばして海まで。真っ青な空の下、サザンより俺たちはチューブだって笑いながら、日が暮れるまではしゃいだ夏。",
    memoryYear: 1986,
    lifeStage: "高校3年・最高の夏休み",
    songQuery: "TUBE シーズン・イン・ザ・サン",
    expectArtist: "TUBE",
    expectTitle: "シーズン・イン・ザ・サン",
    views: 2980,
  },
  {
    nickname: "あや",
    birthYear: 1979,
    gender: "女性",
    memoryText:
      "朝練前の誰もいない教室で、友達と大声でこの曲を歌った。何でも出来る気がして、毎日がきらきら眩しかった高2の春。",
    memoryYear: 1995,
    lifeStage: "高校2年・部活漬けの日々",
    songQuery: "大黒摩季 ら・ら・ら",
    expectArtist: "大黒摩季",
    expectTitle: "ら・ら・ら",
    views: 3870,
  },
  {
    nickname: "けんと",
    birthYear: 1992,
    gender: "男性",
    memoryText:
      "運動会のクラス対抗リレー、ビリだったのに全員で大笑いした。一人ひとり違っていいって、この歌に背中を押された秋。",
    memoryYear: 2003,
    lifeStage: "小学6年・運動会の日",
    songQuery: "SMAP 世界に一つだけの花",
    expectArtist: "SMAP",
    expectTitle: "世界に一つだけの花",
    views: 5120,
  },
  {
    nickname: "だいき",
    birthYear: 1986,
    gender: "男性",
    memoryText:
      "サークル仲間と海辺でBBQ、花火して朝まで語った。みんなまだ若くて、未来が眩しくて、最高に幸せな夏だった。",
    memoryYear: 2005,
    lifeStage: "大学2年・忘れられない夏",
    songQuery: "ケツメイシ 夏の思い出",
    expectArtist: "ケツメイシ",
    expectTitle: "夏の思い出",
    views: 4460,
  },
  {
    nickname: "みお",
    birthYear: 1994,
    gender: "女性",
    memoryText:
      "文化祭のステージでクラス全員で踊った。緊張も忘れて、ただ笑顔が弾けてた。あんなに無敵だった日はもう来ないかも。",
    memoryYear: 2009,
    lifeStage: "高校1年・文化祭",
    songQuery: "いきものがかり じょいふる",
    expectArtist: "いきものがかり",
    expectTitle: "じょいふる",
    views: 6230,
  },
  {
    nickname: "さく",
    birthYear: 2003,
    gender: "女性",
    memoryText:
      "妹と毎日リビングで縄跳びダンスを踊ってた。家にいる時間が増えて、笑い転げて、こんな時でも幸せは作れるって思えた。",
    memoryYear: 2020,
    lifeStage: "高校3年・おうち時間",
    songQuery: "NiziU Make you happy",
    expectArtist: "NiziU",
    expectTitle: "Make you happy",
    views: 7340,
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

// 1件分のカプセルを作る（iTunes取得 → AI画像生成 → Firestore保存）
async function seedOne(demo: Demo) {
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
}

// バッチ（標準セット / 明るいセット）ごとの実行UI
function SeedBatch({
  title,
  description,
  demos,
  accent,
  icon,
}: {
  title: string;
  description: string;
  demos: Demo[];
  accent: string;
  icon: React.ReactNode;
}) {
  const [statuses, setStatuses] = useState<Status[]>(demos.map(() => "pending"));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const setStatus = (i: number, s: Status) =>
    setStatuses((prev) => prev.map((v, idx) => (idx === i ? s : v)));
  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const runAll = async () => {
    if (running) return;
    if (!auth.currentUser) {
      addLog("⚠ ログインしてから実行してください");
      return;
    }
    setRunning(true);
    setFinished(false);
    for (let i = 0; i < demos.length; i++) {
      setStatus(i, "running");
      try {
        await seedOne(demos[i]);
        setStatus(i, "done");
        addLog(`✓ ${demos[i].songQuery} を作成しました`);
      } catch (e) {
        setStatus(i, "error");
        addLog(`✗ ${demos[i].songQuery}：${e instanceof Error ? e.message : "失敗"}`);
      }
    }
    setRunning(false);
    setFinished(true);
  };

  const doneCount = statuses.filter((s) => s === "done").length;

  return (
    <div className="space-y-4 rounded-2xl bg-[#150f1a] border border-[#2d1e30] p-4">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-[#ede0e8] text-base font-medium">
          {icon}
          {title}
        </h2>
        <p className="text-[#7a6475] text-xs leading-relaxed">{description}</p>
      </div>

      <button
        onClick={runAll}
        disabled={running || finished}
        className="w-full flex items-center justify-center gap-2 text-[#0e0b0e] text-sm font-semibold py-3.5 rounded-full disabled:opacity-40"
        style={{ backgroundColor: accent }}
      >
        {running ? (
          <><Loader2 size={16} className="animate-spin" />作成中…（{doneCount}/{demos.length}）</>
        ) : finished ? (
          <><CheckCircle size={16} />完了しました</>
        ) : (
          <><Sparkles size={16} />{demos.length}件作成する</>
        )}
      </button>

      <div className="space-y-2">
        {demos.map((demo, i) => {
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

      {log.length > 0 && (
        <div className="space-y-1 pt-1">
          {log.map((l, i) => (
            <p key={i} className="text-[#7a6475] text-[10px] font-mono">{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeedPage() {
  return (
    <div className="pb-24 min-h-screen">
      <div className="sticky top-0 z-40 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href="/" className="text-[#b899a8]"><ArrowLeft size={20} /></Link>
          <span className="text-[#ede0e8] text-sm font-medium">デモを作成</span>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        <p className="text-[#7a6475] text-xs leading-relaxed">
          本物のAI画像つきのデモ投稿を作成します。1セットあたり3〜5分ほどかかります。途中で画面を閉じないでください。
        </p>

        <SeedBatch
          title="各年代の名曲セット"
          description="80年代〜2020年代の名曲に紐づくデモ6件。しっとりした記憶は年代に合わせたセピア調になります。"
          demos={DEMOS}
          accent="#c48a9f"
          icon={<Sparkles size={16} className="text-[#c48a9f]" />}
        />

        <SeedBatch
          title="明るい思い出セット"
          description="夏・青春・はしゃいだ記憶 × アップテンポな名曲6件。AIが前向きなムードを検出し、晴れた鮮やかな画像を生成します。"
          demos={BRIGHT_DEMOS}
          accent="#e0b35a"
          icon={<Sun size={16} className="text-[#e0b35a]" />}
        />

        <Link href="/" className="block text-center bg-[#221928] border border-[#2d1e30] text-[#ede0e8] text-sm py-3 rounded-full">
          ホームで確認する
        </Link>
      </div>
    </div>
  );
}

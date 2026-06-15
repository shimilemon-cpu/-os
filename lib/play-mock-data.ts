import type { PlayTemplate, PlayCategory } from "./play-types";

export const CATEGORIES: PlayCategory[] = [
  "すべて",
  "ひとり",
  "友達と",
  "カップルで",
  "家で",
  "外で",
];

export const FEATURED_ID = "4";

export const mockTemplates: PlayTemplate[] = [
  {
    id: "1",
    title: "知らない道だけ歩いてみる",
    tagline: "地図なし、勘だけ。迷ってもいい。",
    description:
      "スマホの地図は使わず、行ったことのない道だけ選んで歩いてみよう。近所なのに、どこか旅をしている気分になる。",
    primaryCategory: "外で",
    tags: ["ひとり", "外で"],
    durationLabel: "2〜4時間",
    peopleLabel: "ひとりで",
    stuff: ["歩きやすい靴", "飲み物", "小銭（気になるお店に入れるように）"],
    steps: [
      "スマホの地図アプリを閉じる（大事）",
      "家を出たら「なんとなく気になる方」に進む",
      "知ってる道に出たら別の道を選ぶ",
      "疲れたら帰り方を考える（ここだけマップOK）",
      "気になったもの・場所を3枚写真に撮る",
    ],
    gradient: "from-orange-400 to-red-400",
    emoji: "🗺️",
    doCount: 3421,
    reports: [
      {
        nickname: "yuki_28",
        comment: "近所に知らない神社があった。住んで5年なのに",
        image: "https://picsum.photos/seed/play1a/200/200",
      },
      {
        nickname: "たろう",
        comment: "完全に迷子になったけど楽しかった",
        image: "https://picsum.photos/seed/play1b/200/200",
      },
      {
        nickname: "momo",
        comment: "2時間歩いたら1.8万歩だった",
        image: "https://picsum.photos/seed/play1c/200/200",
      },
    ],
  },
  {
    id: "2",
    title: "映画3本テーマ縛りマラソン",
    tagline: "「監督縛り」でも「色縛り」でも。",
    description:
      "テーマを決めて映画を3本連続で見る。途中で感想を言い合うのが最高。",
    primaryCategory: "家で",
    tags: ["友達と", "家で"],
    durationLabel: "6〜9時間",
    peopleLabel: "1〜4人",
    stuff: ["動画サービス（Netflix・Amazon等）", "お菓子と飲み物", "ブランケット"],
    steps: [
      "テーマを決める（例：「雨が降る映画」「主人公が走る映画」）",
      "各自1本ずつ選んで計3本を決定",
      "1本目を見る",
      "感想タイム10分（ここが最高）",
      "2本目 → 感想タイム → 3本目",
      "全体投票：1番よかった映画を選ぶ",
    ],
    gradient: "from-cyan-400 to-teal-500",
    emoji: "🎬",
    doCount: 8902,
    reports: [
      {
        nickname: "えいが好き",
        comment: "「主人公が食べてる映画」縛りで盛り上がった",
        image: "https://picsum.photos/seed/play2a/200/200",
      },
      {
        nickname: "りく",
        comment: "感想タイムが本編より長くなった",
        image: "https://picsum.photos/seed/play2b/200/200",
      },
    ],
  },
  {
    id: "3",
    title: "コンビニスイーツ全種制覇",
    tagline: "予算1000円。どこまでいける？",
    description:
      "コンビニ3店舗でスイーツを1個ずつ買って食べ比べ。どこのプリンが最強か決めよう。",
    primaryCategory: "外で",
    tags: ["友達と", "外で", "ひとり"],
    durationLabel: "1〜2時間",
    peopleLabel: "1〜3人",
    stuff: ["現金500〜1500円", "食べ比べメモ or スマホ"],
    steps: [
      "テーマを決める（例：「プリン部門」「チョコ系部門」）",
      "セブン・ファミマ・ローソンを順番に回る",
      "各店で同じカテゴリのスイーツを1個買う",
      "食べ比べて採点（見た目・味・コスパ）",
      "グランプリ発表",
    ],
    gradient: "from-yellow-400 to-amber-400",
    emoji: "🍮",
    doCount: 5620,
    reports: [
      {
        nickname: "甘党",
        comment: "セブンのプリンが最強でした（異論は認めない）",
        image: "https://picsum.photos/seed/play3a/200/200",
      },
    ],
  },
  {
    id: "4",
    title: "日没に間に合うように家を出る",
    tagline: "今日の夕焼け、どこから見る？",
    description:
      "日没30分前にスマホで時刻を調べ、間に合う場所に急いで向かう。特に予定なし。ただ夕焼けを見るだけ。",
    primaryCategory: "外で",
    tags: ["ひとり", "カップルで", "外で"],
    durationLabel: "1〜2時間",
    peopleLabel: "ひとり〜2人",
    stuff: ["スマホ（日没時刻調べ用）", "温かい飲み物（秋冬）"],
    steps: [
      "スマホで「今日の日没時刻」を調べる",
      "30分以内に行ける「高い場所」か「開けた場所」を探す",
      "急いで向かう（これが大事）",
      "ギリギリ間に合った達成感を味わう",
      "1枚だけ写真を撮る",
    ],
    gradient: "from-amber-400 to-orange-500",
    emoji: "🌅",
    doCount: 12043,
    reports: [
      {
        nickname: "あおい",
        comment: "川の土手から見た。最高だった",
        image: "https://picsum.photos/seed/play4a/200/200",
      },
      {
        nickname: "けんた",
        comment: "2分遅れて夕暮れだったけどそれもよかった",
        image: "https://picsum.photos/seed/play4b/200/200",
      },
    ],
  },
  {
    id: "5",
    title: "図書館でランダム本チャレンジ",
    tagline: "読まないジャンルの本を、勘で選ぶ。",
    description:
      "図書館に行って、普段絶対読まない棚に行き、目をつぶって1冊選ぶ。それを2時間読む。",
    primaryCategory: "外で",
    tags: ["ひとり", "外で"],
    durationLabel: "2〜3時間",
    peopleLabel: "ひとりで",
    stuff: ["図書館カード（あれば）"],
    steps: [
      "近くの図書館に行く",
      "いつも行かない棚へ（料理→建築、小説→科学など）",
      "目をつぶって背表紙を指でなぞり、止まったところで1冊選ぶ",
      "テーブルに座って2時間読む",
      "読み終えたら「なにを学んだか」1行メモする",
    ],
    gradient: "from-green-400 to-emerald-500",
    emoji: "📚",
    doCount: 4231,
    reports: [
      {
        nickname: "さくら",
        comment: "江戸時代の染め物の本を読んだ。面白すぎた",
        image: "https://picsum.photos/seed/play5a/200/200",
      },
    ],
  },
  {
    id: "6",
    title: "深夜ドライブ＋ファミレス作戦",
    tagline: "23時以降しか味わえないやつ。",
    description:
      "深夜にドライブして、ファミレスでドリンクバーを頼んで話す。話題はなんでも。",
    primaryCategory: "外で",
    tags: ["友達と", "外で"],
    durationLabel: "3〜5時間",
    peopleLabel: "2〜4人",
    stuff: ["車（または自転車でも可）", "現金1000円くらい", "眠気覚ましのガム"],
    steps: [
      "23時以降に集合",
      "行き先なしでとにかく走る（30〜60分）",
      "気になるファミレスに入る",
      "ドリンクバーを頼んでずっと話す",
      "帰りたくない感が出たら成功",
    ],
    gradient: "from-violet-500 to-purple-600",
    emoji: "🚗",
    doCount: 19876,
    reports: [
      {
        nickname: "そうた",
        comment: "朝5時まで話し込んだ。最高の夜",
        image: "https://picsum.photos/seed/play6a/200/200",
      },
      {
        nickname: "はな",
        comment: "ドリンクバー5杯飲んだ",
        image: "https://picsum.photos/seed/play6b/200/200",
      },
    ],
  },
  {
    id: "7",
    title: "朝5時起き、日の出ランニング",
    tagline: "誰もいない街は、違う街みたいだ。",
    description:
      "目覚ましを5時にセットして、日の出に合わせて走る。いつもの街が全然違って見える。",
    primaryCategory: "外で",
    tags: ["ひとり", "外で"],
    durationLabel: "1〜2時間",
    peopleLabel: "ひとりで",
    stuff: ["ランニングシューズ", "イヤホン", "水"],
    steps: [
      "前日に「明日の日の出時刻」を調べてアラームをセット",
      "5時に起きる（最難関）",
      "着替えて何も考えずに外に出る",
      "太陽が出てくる方向に向かって走る",
      "帰宅後、写真を1枚投稿する",
    ],
    gradient: "from-yellow-300 to-amber-500",
    emoji: "🌄",
    doCount: 7654,
    reports: [
      {
        nickname: "あきら",
        comment: "5時の公園、鳥の声だけ。最高だった",
        image: "https://picsum.photos/seed/play7a/200/200",
      },
    ],
  },
  {
    id: "8",
    title: "料理対決（テーマ：同じ食材）",
    tagline: "同じ材料で、全然違うものができる。",
    description:
      "同じ食材（例：卵、じゃがいも）を使って各自が別の料理を作る。食べ比べて勝負。",
    primaryCategory: "家で",
    tags: ["友達と", "家で", "カップルで"],
    durationLabel: "2〜3時間",
    peopleLabel: "2〜4人",
    stuff: ["食材（テーマに合わせて）", "調理道具", "お皿"],
    steps: [
      "テーマ食材を決める（例：「じゃがいも」「トマト缶」）",
      "30分で料理を作る（同じキッチンでもOK）",
      "盛り付けて写真を撮る",
      "食べ比べて採点（見た目・味・独創性）",
      "負けた人が後片付け",
    ],
    gradient: "from-red-400 to-rose-500",
    emoji: "🍳",
    doCount: 3102,
    reports: [
      {
        nickname: "みな",
        comment: "同じ卵で私はオムライス、彼はスフレ。彼の勝ち",
        image: "https://picsum.photos/seed/play8a/200/200",
      },
    ],
  },
];

export interface Track {
  title: string;
  artist: string;
  artwork: string;
  youtubeVideoId: string;
}

export interface Capsule {
  id: string;
  user: { age: number; gender: string };
  memoryText: string;
  memoryYear: number;
  lifeStage: string;
  song: Track;
  images: string[];
  views: number;
  createdAt: string;
}

export const mockCapsules: Capsule[] = [
  {
    id: "1",
    user: { age: 34, gender: "男性" },
    memoryText: "高校の文化祭前日、体育館の隅でみんなで段ボールを切りながらこの曲をずっと歌ってた。あの夜が永遠に続けばいいと思ってた。",
    memoryYear: 2006,
    lifeStage: "高校2年生の秋",
    song: {
      title: "青春アミーゴ",
      artist: "修二と彰",
      artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/3f/d2/a4/3fd2a4f7-c6c9-6f8a-e9e0-c3e3f3f3f3f3/source/100x100bb.jpg",
      youtubeVideoId: "x8VYWazR5mE",
    },
    images: [
      "https://picsum.photos/seed/cap1a/400/600",
      "https://picsum.photos/seed/cap1b/400/600",
      "https://picsum.photos/seed/cap1c/400/600",
      "https://picsum.photos/seed/cap1d/400/600",
    ],
    views: 342,
    createdAt: "2024-11-03",
  },
  {
    id: "2",
    user: { age: 29, gender: "女性" },
    memoryText: "大学最後の夏、友達と深夜ドライブしながら窓全開で叫んでた。何も怖くない気がしてたあの夜。",
    memoryYear: 2016,
    lifeStage: "大学4年生の夏",
    song: {
      title: "Lemon",
      artist: "米津玄師",
      artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/4e/3b/5c/4e3b5c2f-3f3f-3f3f-3f3f-3f3f3f3f3f3f/source/100x100bb.jpg",
      youtubeVideoId: "SX_ViT4Ra7k",
    },
    images: [
      "https://picsum.photos/seed/cap2a/400/600",
      "https://picsum.photos/seed/cap2b/400/600",
      "https://picsum.photos/seed/cap2c/400/600",
      "https://picsum.photos/seed/cap2d/400/600",
    ],
    views: 891,
    createdAt: "2024-10-22",
  },
  {
    id: "3",
    user: { age: 42, gender: "男性" },
    memoryText: "就職1年目、終電を逃してひとりで歩いて帰った夜。疲れてたけど、街の灯りがやけに綺麗に見えた。",
    memoryYear: 1999,
    lifeStage: "社会人1年目の冬",
    song: {
      title: "Everything",
      artist: "MISIA",
      artwork: "https://picsum.photos/seed/misia/100/100",
      youtubeVideoId: "x8VYWazR5mE",
    },
    images: [
      "https://picsum.photos/seed/cap3a/400/600",
      "https://picsum.photos/seed/cap3b/400/600",
      "https://picsum.photos/seed/cap3c/400/600",
      "https://picsum.photos/seed/cap3d/400/600",
    ],
    views: 1204,
    createdAt: "2024-09-14",
  },
  {
    id: "4",
    user: { age: 38, gender: "女性" },
    memoryText: "受験勉強の夜中2時、台所でカップ麺を食べながら聴いてた。合格発表の日のことより、あの静かな夜を覚えてる。",
    memoryYear: 2003,
    lifeStage: "高校3年生の冬",
    song: {
      title: "夜に駆ける",
      artist: "YOASOBI",
      artwork: "https://picsum.photos/seed/yoasobi/100/100",
      youtubeVideoId: "x8VYWazR5mE",
    },
    images: [
      "https://picsum.photos/seed/cap4a/400/600",
      "https://picsum.photos/seed/cap4b/400/600",
      "https://picsum.photos/seed/cap4c/400/600",
      "https://picsum.photos/seed/cap4d/400/600",
    ],
    views: 567,
    createdAt: "2024-08-30",
  },
  {
    id: "5",
    user: { age: 31, gender: "男性" },
    memoryText: "第一子が生まれた日の朝、病院の廊下でひとりで聴いてた。涙が止まらなかった理由が今もうまく言えない。",
    memoryYear: 2020,
    lifeStage: "30歳・第一子誕生の朝",
    song: {
      title: "栄光の架橋",
      artist: "ゆず",
      artwork: "https://picsum.photos/seed/yuzu/100/100",
      youtubeVideoId: "SX_ViT4Ra7k",
    },
    images: [
      "https://picsum.photos/seed/cap5a/400/600",
      "https://picsum.photos/seed/cap5b/400/600",
      "https://picsum.photos/seed/cap5c/400/600",
      "https://picsum.photos/seed/cap5d/400/600",
    ],
    views: 2341,
    createdAt: "2024-07-01",
  },
  {
    id: "6",
    user: { age: 26, gender: "女性" },
    memoryText: "中学の部活帰り、自転車で坂を下りながら夕焼けに向かって叫んだことがある。何を叫んだか忘れたけど、あの風は覚えてる。",
    memoryYear: 2012,
    lifeStage: "中学2年生の夏",
    song: {
      title: "Tomorrow never knows",
      artist: "Mr.Children",
      artwork: "https://picsum.photos/seed/mrchildren/100/100",
      youtubeVideoId: "x8VYWazR5mE",
    },
    images: [
      "https://picsum.photos/seed/cap6a/400/600",
      "https://picsum.photos/seed/cap6b/400/600",
      "https://picsum.photos/seed/cap6c/400/600",
      "https://picsum.photos/seed/cap6d/400/600",
    ],
    views: 788,
    createdAt: "2024-06-18",
  },
];

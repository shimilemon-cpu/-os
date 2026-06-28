# デザインAI依頼プロンプト

---

## 日本語版（v0 / Galileo AI / Figma AI などに貼り付け）

```
「大喜利Pocket」というスマートフォンアプリ（PWA）のUIデザインをリデザインしてください。

## アプリ概要
友達3〜5人でリアルタイムに遊ぶAI大喜利アプリ。
AIがお題を出し、みんなが回答し、投票・AI採点で勝者を決める。

## ターゲット
20〜30代の友達グループ。飲み会・深夜の雑談・通話中に使う。

## デザインコンセプト（現状からの変更）
現在：暗いセピア・古写真風（タイムカプセルアプリの名残で不適切）
目標：お笑い・バラエティ番組のような「熱量と笑い」が伝わるポップなデザイン

## デザイン要件
- カラー：黒ベースだが差し色にビビッドな黄色・オレンジ・ピンクなどを使う
- フォント：丸ゴシック系・太字・インパクト重視
- 雰囲気：深夜バラエティ・お笑い番組・ゲームセンターのような熱量感
- アニメーション：回答が一枚ずつめくれる・スコアがカウントアップするなど演出重視
- スマホ縦画面（390×844px）に最適化
- ダークテーマ必須（夜の使用が多いため）

## リデザインしてほしい画面（優先度順）

### 1. ゲーム回答画面（最重要）
- お題テキストを画面中央に大きく・インパクトのある吹き出し風カードで表示
- タイマーは画面上部に大きく・緊張感を演出
- 回答テキストエリアはシンプルに下部固定
- 「回答する」ボタンは大きく・押したくなるデザイン

### 2. 投票画面
- 回答カードがトランプのように並ぶ
- 😂🧠🤯のリアクションボタンは大きく・押した瞬間エフェクト
- 匿名ラベル（A・B・C・D）は目立つデザイン

### 3. ラウンド結果画面
- 👑MVP回答を演出付きで大きく表示（紙吹雪・スポットライト風）
- AI審査員3人（👑王道・🔪辛口・🌀カオス）の採点を個性的なカードで表示
- スコア数字のカウントアップアニメーション

### 4. 待合室
- 参加者のアバターが並ぶ
- 「準備OK」ボタンは緑のネオン系
- 招待コードは大きく・コピーしやすいデザイン

### 5. ルーム一覧（ホーム）
- ゲームへの期待感を高めるデザイン
- 参加中ルームのカードはステータス（待機中/ゲーム中）が一目でわかる

## 参考イメージ
- Kahoot!（緑×クイズゲーム）のような熱量
- LINEゲームセンターのポップさ
- お笑い賞レースの得点ボードのような数字の見せ方

## 使用するカラーパレット（提案）
- 背景：#0d0d0d〜#1a1a1a（純黒に近いダーク）
- メインアクセント：#FFD600（ビビッドイエロー）
- サブアクセント：#FF4D6D（ビビッドピンク）または #FF6B00（オレンジ）
- 😂 funny：#FFD600（イエロー）
- 🧠 smart：#00B4FF（ブルー）
- 🤯 crazy：#BF5FFF（パープル）
- テキスト：#FFFFFF
- カード背景：#1E1E1E〜#2A2A2A

## 出力形式
各画面のモバイルUIデザイン（390×844px）
Figmaコンポーネントまたは画像で提出
```

---

## 英語版（海外AIツール向け）

```
Redesign the UI for "Ogiri Pocket" — a mobile party game app (PWA) for Japanese comedy Q&A (Ogiri).

## App Summary
3-5 friends play together in real-time. AI generates funny prompts, players answer anonymously, everyone votes, and AI judges score each answer with 3 personas (Mainstream👑, Harsh🔪, Chaos🌀).

## Design Direction
FROM: Dark sepia / vintage photo aesthetic (leftover from old capsule app)
TO: Pop, energetic, late-night variety show / arcade game energy

## Requirements
- Dark theme (black base #0d0d0d) with vivid yellow #FFD600 as primary accent
- Bold rounded typography, high impact
- Feels like a game show scoreboard meets arcade machine
- Mobile-first, 390×844px portrait
- Generous use of emoji 😂🧠🤯 as UI elements

## Key Screens to Design (priority order)

1. **Answer Phase** — Large question card center screen, countdown timer top, answer input pinned bottom, big CTA button
2. **Voting Phase** — Answer cards like playing cards, large reaction buttons (😂🧠🤯) with tap effects
3. **Round Result** — MVP reveal with confetti/spotlight, AI judge score cards with personality, score count-up animation
4. **Waiting Room** — Player avatars in a row, glowing green "Ready!" button, invite code prominently displayed
5. **Home/Room List** — Energy-building design, clear status indicators

## Color Palette
- Background: #0d0d0d
- Primary accent: #FFD600 (vivid yellow)
- Secondary: #FF4D6D (pink) or #FF6B00 (orange)
- funny😂: #FFD600, smart🧠: #00B4FF, crazy🤯: #BF5FFF
- Text: #FFFFFF
- Card surface: #1E1E1E

## References
- Kahoot! energy level
- Japanese game show score reveal
- Arcade game cabinet aesthetics
```

---

## おすすめの依頼先AIツール

| ツール | 用途 | URL |
|--------|------|-----|
| **v0.dev** | ReactコンポーネントをAIが直接生成 → そのままコードに使える | v0.dev |
| **Galileo AI** | 画面デザインをプロンプトから生成 | usegalileo.ai |
| **Figma AI** | Figma内でデザイン生成 | figma.com |
| **Uizard** | アプリUIをテキストから生成 | uizard.io |

**v0.devが一番おすすめ**です。生成されたReactコンポーネントのコードをそのままこのアプリに貼り付けられます。

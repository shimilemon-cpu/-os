// 地域・景色タイプの選択肢と、Flux向けの英語ビジュアル記述を一元管理。
// オンボーディング・マイページ・画像生成APIすべてここを参照する。

export const REGIONS = [
  "北海道",
  "東北",
  "関東（東京・神奈川など）",
  "中部・東海",
  "関西（大阪・京都・神戸など）",
  "中国・四国",
  "九州",
  "沖縄",
] as const;

export const ENV_TYPES = [
  "都心・繁華街",
  "郊外・住宅街",
  "地方都市",
  "田舎・農村",
  "海沿いの町",
  "山間の集落",
] as const;

export type RegionKey = (typeof REGIONS)[number];
export type EnvTypeKey = (typeof ENV_TYPES)[number];

const REGION_VISUAL: Record<string, string> = {
  "北海道": "Hokkaido wide snowy plains, dairy farms, straight open roads, birch forests, distant mountains",
  "東北": "Tohoku snow country, dense cedar forests, rice paddy villages, traditional wooden farmhouses",
  "関東（東京・神奈川など）": "Kanto suburban sprawl, overhead train lines, concrete apartment blocks, convenience store lights",
  "中部・東海": "flat Tokai plains, mountain backdrop, mid-size city streets, local rail crossing",
  "関西（大阪・京都・神戸など）": "Kansai urban density, old machiya townhouses, narrow canal-side alleys, lantern-lit market streets",
  "中国・四国": "rural Chugoku-Shikoku, quiet fishing inlet, terraced citrus orchards, old tiled-roof town",
  "九州": "Kyushu warm subtropical climate, old merchant townscape, distant volcanic silhouette",
  "沖縄": "Okinawa subtropical coast, red roof tiles, banyan trees, turquoise sea visible between buildings",
};

const ENV_VISUAL: Record<string, string> = {
  "都心・繁華街": "dense city center, high-rise office towers, crowded crossing, underground shopping arcade, neon reflections on wet pavement",
  "郊外・住宅街": "quiet residential street, bicycle leaning on wall, vending machine by sidewalk, small neighborhood park, laundry drying on balcony",
  "地方都市": "mid-size regional city, covered shopping arcade, old department store facade, local bus terminal, slow Saturday afternoon",
  "田舎・農村": "rice paddies in every direction, irrigation canal, corrugated iron barn, persimmon tree by the road, kei truck parked",
  "海沿いの町": "fishing port, weathered concrete seawall, moored wooden boats, salt-bleached buildings, seagulls on power line",
  "山間の集落": "steep terraced fields, narrow winding road up the valley, cedar slope, morning mist, old stone wall retaining earth",
};

// 地域＋景色タイプをFluxプロンプト用の英語記述に変換する。
// 未設定の場合は空文字を返し、呼び出し側でスキップする。
export function buildRegionContext(region: string | null | undefined, envType: string | null | undefined): string {
  const parts: string[] = [];
  if (region && REGION_VISUAL[region]) parts.push(REGION_VISUAL[region]);
  if (envType && ENV_VISUAL[envType]) parts.push(ENV_VISUAL[envType]);
  return parts.join("; ");
}

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Google Fonts から、表示する文字だけの日本語フォント(ttf)を取得する
async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(
      text
    )}`;
    const cssRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    // ttf/otf のURLだけを採用（woff2 はSatoriが扱えない）
    const match = css.match(/src:\s*url\((https:\/\/[^)]+?\.(?:ttf|otf))\)/i);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    const buf = await fontRes.arrayBuffer();
    // OpenType署名を検証（壊れたデータでSatoriがクラッシュするのを防ぐ）
    const sig = new Uint8Array(buf.slice(0, 4));
    const hex = Array.from(sig)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const valid = ["00010000", "4f54544f", "74727565", "74746366"].includes(hex);
    return valid ? buf : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const img = searchParams.get("img") || "";
  const text = (searchParams.get("text") || "").slice(0, 100);
  const song = searchParams.get("song") || "";
  const artist = searchParams.get("artist") || "";
  const year = searchParams.get("year") || "";

  const allText =
    text +
    song +
    artist +
    year +
    "年CAPSULE3分半で、あの日に帰ろう。♪／の記憶ある日";
  const fontData = await loadJapaneseFont(allText);

  // フォントが取れない場合はテキストを諦めて画像だけのカードにフォールバック
  if (!fontData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            backgroundColor: "#1b1410",
          }}
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} width={1080} height={1920} style={{ width: "1080px", height: "1920px", objectFit: "cover" }} alt="" />
          )}
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  }

  const fonts = [
    { name: "NotoJP", data: fontData, weight: 700 as const, style: "normal" as const },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1b1410",
          fontFamily: "NotoJP",
        }}
      >
        {/* 上半分：記憶の画像 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "1080px",
            height: "1180px",
          }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              width={1080}
              height={1180}
              style={{ width: "1080px", height: "1180px", objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div style={{ width: "1080px", height: "1180px", backgroundColor: "#2a1f17" }} />
          )}
          {/* 下方向への暗いグラデーション */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "1080px",
              height: "600px",
              display: "flex",
              backgroundImage:
                "linear-gradient(to bottom, rgba(14,11,14,0), rgba(14,11,14,1))",
            }}
          />
        </div>

        {/* 下半分：テキスト */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "0 80px 90px 80px",
            justifyContent: "flex-end",
            marginTop: "-260px",
          }}
        >
          <div style={{ display: "flex", color: "#e0a567", fontSize: "34px", marginBottom: "24px" }}>
            {year ? `${year}年の記憶` : "ある日の記憶"}
          </div>
          <div
            style={{
              display: "flex",
              color: "#f3e7d6",
              fontSize: "52px",
              lineHeight: 1.6,
              marginBottom: "44px",
            }}
          >
            {text}
          </div>
          <div style={{ display: "flex", color: "#cbab84", fontSize: "32px", marginBottom: "70px" }}>
            {song ? `♪ ${song} ／ ${artist}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid #45331f",
              paddingTop: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#e0a567",
                fontSize: "40px",
                letterSpacing: "12px",
                fontWeight: 700,
              }}
            >
              CAPSULE
            </div>
            <div style={{ display: "flex", color: "#b0916f", fontSize: "26px", marginTop: "10px" }}>
              3分半で、あの日に帰ろう。
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts,
    }
  );
}

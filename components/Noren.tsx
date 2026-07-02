interface Props {
  text?: string;
  color?: string;
  height?: number;
}

export default function Noren({ text = "大喜利", color = "#E5402F", height = 62 }: Props) {
  return (
    <div className="relative w-full noren-shadow" style={{ height }}>
      {/* 竿 (top rod) */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: 5, background: "linear-gradient(180deg,#3d2417,#1a1714)", borderRadius: 3 }}
      />
      {/* 3枚の暖簾 */}
      <div className="absolute left-0 right-0 flex" style={{ top: 5, height: height - 5, gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 flex items-start justify-center"
            style={{
              background: `linear-gradient(180deg, ${color}, ${color}dd 60%, ${color}aa 100%)`,
              paddingTop: 10,
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 85% 88%, 50% 100%, 15% 88%, 0 100%)",
            }}
          >
            <span
              className="font-mincho font-extrabold text-paper"
              style={{ fontSize: 13, letterSpacing: "0.14em", writingMode: "vertical-rl" }}
            >
              {text[i] ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface OdaiSheetProps {
  imageUrl: string;
  text?: string;
  roundNumber?: number;
}

export default function OdaiSheet({ imageUrl, text, roundNumber }: OdaiSheetProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 22,
        background: "linear-gradient(150deg, #1A1714, #2C261E)",
        padding: "3px",
      }}
    >
      {/* Inner card */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 20,
          background: "#FBF7EC",
        }}
      >
        {/* Top label */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "10px 16px 8px" }}
        >
          <p
            className="font-mincho font-extrabold"
            style={{ fontSize: 11, color: "#B6AC97", letterSpacing: "0.2em" }}
          >
            ＼ {roundNumber ? `第${roundNumber}問` : "お題"} ／
          </p>
          <span
            className="font-gothic font-extrabold"
            style={{
              fontSize: 9,
              padding: "2px 8px",
              borderRadius: 999,
              background: "#FCE7E3",
              color: "#E5402F",
            }}
          >
            持ち寄り
          </span>
        </div>

        {/* Photo area */}
        <div className="relative mx-[12px]" style={{ borderRadius: 14, overflow: "hidden" }}>
          <div
            className="relative w-full"
            style={{
              paddingBottom: "75%",
              background: loaded ? "transparent" : "#EBE2CF",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="お題の写真"
              onLoad={() => setLoaded(true)}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
            />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Text prompt area */}
        <div style={{ padding: "10px 16px 14px" }}>
          <p
            className="font-mincho font-extrabold text-[#1A1714]"
            style={{ fontSize: 20, lineHeight: 1.5 }}
          >
            {text || "この写真で一言"}
          </p>
        </div>

        {/* Corner ornaments */}
        <svg
          className="absolute top-[2px] left-[2px]"
          width="20" height="20" viewBox="0 0 20 20"
          style={{ opacity: 0.15 }}
        >
          <path d="M2 18V6a4 4 0 0 1 4-4h12" fill="none" stroke="#1A1714" strokeWidth="2" />
        </svg>
        <svg
          className="absolute top-[2px] right-[2px]"
          width="20" height="20" viewBox="0 0 20 20"
          style={{ opacity: 0.15 }}
        >
          <path d="M18 18V6a4 4 0 0 0-4-4H2" fill="none" stroke="#1A1714" strokeWidth="2" />
        </svg>
        <svg
          className="absolute bottom-[2px] left-[2px]"
          width="20" height="20" viewBox="0 0 20 20"
          style={{ opacity: 0.15 }}
        >
          <path d="M2 2v12a4 4 0 0 0 4 4h12" fill="none" stroke="#1A1714" strokeWidth="2" />
        </svg>
        <svg
          className="absolute bottom-[2px] right-[2px]"
          width="20" height="20" viewBox="0 0 20 20"
          style={{ opacity: 0.15 }}
        >
          <path d="M18 2v12a4 4 0 0 1-4 4H2" fill="none" stroke="#1A1714" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

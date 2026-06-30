"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import Engimono from "@/components/Engimono";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/rooms");
    });
    return unsub;
  }, [router]);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div
        className="relative w-full max-w-sm overflow-hidden bg-paper"
        style={{ aspectRatio: "4/3", borderRadius: 22, boxShadow: "0 24px 60px -28px rgba(40,30,10,.4)", border: "1px solid rgba(0,0,0,.05)" }}
      >
        {/* Floating charms */}
        <Engimono name="cat" width={96} style={{ position: "absolute", top: "-3%", right: "4%", width: "30%", "--r": "8deg", animation: "floaty 7s ease-in-out infinite" } as React.CSSProperties} />
        <Engimono name="daruma" width={80} style={{ position: "absolute", top: "18%", right: "26%", width: "24%", "--r": "-10deg", animation: "floaty 6s ease-in-out .4s infinite" } as React.CSSProperties} />
        <Engimono name="tai" width={64} style={{ position: "absolute", top: "2%", right: "30%", width: "18%", "--r": "14deg", animation: "floaty 8s ease-in-out .8s infinite" } as React.CSSProperties} />
        <Engimono name="fuku" width={88} style={{ position: "absolute", bottom: "6%", right: "8%", width: "26%", "--r": "-6deg", animation: "floaty 7.5s ease-in-out .2s infinite" } as React.CSSProperties} />
        <Engimono name="mask" width={52} style={{ position: "absolute", bottom: "24%", right: "34%", width: "15%", "--r": "18deg", animation: "floaty 6.5s ease-in-out 1s infinite" } as React.CSSProperties} />
        <Engimono name="koban" width={48} style={{ position: "absolute", bottom: "8%", left: "30%", width: "14%", "--r": "-14deg", animation: "floaty 7s ease-in-out .6s infinite" } as React.CSSProperties} />

        {/* Left hash rail */}
        <div className="absolute left-0 top-0 bottom-0 w-[34px] overflow-hidden" style={{ background: "linear-gradient(180deg,#E5402F,#F0922B)" }}>
          <div
            className="animate-railup"
            style={{ writingMode: "vertical-rl", fontFamily: "var(--font-display)", fontWeight: 700, color: "#FBF7EC", fontSize: 15, letterSpacing: "0.34em", padding: "14px 0", whiteSpace: "nowrap" }}
          >
            ＃笑門来福　＃本日も大入　＃珍回答歓迎　＃座布団一枚　＃笑門来福　＃本日も大入　＃珍回答歓迎　＃座布団一枚
          </div>
        </div>

        {/* Logo lockup */}
        <div className="absolute" style={{ left: "9%", top: "14%" }}>
          <p className="text-sub" style={{ fontSize: 12, letterSpacing: "0.12em", marginBottom: 8 }}>＠みんなで、ひと笑い</p>
          <p
            className="font-mincho font-extrabold text-[#1A1714]"
            style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.84, letterSpacing: "-0.01em" }}
          >
            大喜<br />利
          </p>
          <p
            className="font-mincho font-extrabold text-red"
            style={{ fontSize: "clamp(20px,4vw,30px)", marginTop: 6, letterSpacing: "0.02em" }}
          >
            Pocket
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-[18px] inline-flex items-center gap-2 font-gothic font-bold text-paper"
            style={{ fontSize: 14, padding: "11px 20px", borderRadius: 999, background: "#1A1714" }}
          >
            部屋をのぞく <span style={{ color: "#F4C422" }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

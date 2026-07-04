import Link from "next/link";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";
import RoomListClient from "./RoomListClient";

export default function RoomsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[78px]">
      {/* Header */}
      <div style={{ padding: "4px 20px 16px" }}>
        <div className="flex items-center justify-between mb-4" style={{ paddingTop: 10 }}>
          <div className="flex items-center gap-3">
            <div className="grid place-items-center" style={{ width: 48, height: 48, background: "#F0EBE0", borderRadius: "50%" }}>
              <Engimono name="cat" width={30} height={32} />
            </div>
            <div>
              <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>寄合所</p>
              <p className="font-gothic text-sub" style={{ fontSize: 11, marginTop: 2 }}>いま笑いが生まれる場所</p>
            </div>
          </div>
          <Link
            href="/rooms/new"
            className="grid place-items-center bg-white"
            style={{ width: 40, height: 40, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
            aria-label="部屋を立てる"
          >
            <Icon name="plus" size={18} color="#1A1714" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      <RoomListClient />

      {/* FAB - centered */}
      <Link
        href="/rooms/new"
        className="fixed flex items-center gap-[6px] font-gothic font-extrabold text-paper"
        style={{
          left: "50%", transform: "translateX(-50%)",
          bottom: 96, fontSize: 14, padding: "13px 24px",
          borderRadius: 999, background: "#E5402F",
          boxShadow: "0 8px 20px rgba(229,64,47,.35)",
          whiteSpace: "nowrap",
        }}
      >
        <Icon name="plus" size={16} color="#FBF7EC" strokeWidth={2.2} />
        部屋を立てる
      </Link>
    </div>
  );
}

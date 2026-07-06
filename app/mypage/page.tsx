import Icon from "@/components/Icon";
import MyPageClient from "./MyPageClient";

export default function MyPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-paper pb-[78px]">
      {/* Header */}
      <div style={{ padding: "4px 20px 24px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>私の部屋</p>
          <button
            className="grid place-items-center bg-white"
            style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
          >
            <Icon name="dots" size={18} color="#1A1714" />
          </button>
        </div>
      </div>

      <MyPageClient />
    </div>
  );
}

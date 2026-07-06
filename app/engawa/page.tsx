import Icon from "@/components/Icon";
import EngawaClient from "./EngawaClient";

export default function EngawaPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-paper pb-[78px]">
      {/* Header */}
      <div style={{ padding: "4px 20px 16px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>縁側</p>
          <button
            className="grid place-items-center bg-white"
            style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
          >
            <Icon name="search" size={18} color="#1A1714" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <EngawaClient />
    </div>
  );
}

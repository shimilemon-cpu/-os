import { mockCapsules } from "@/lib/mock-data";
import CapsuleCard from "@/components/CapsuleCard";
import { Eye, Archive } from "lucide-react";

const myCapsules = mockCapsules.slice(0, 3);
const totalViews = myCapsules.reduce((sum, c) => sum + c.views, 0);

export default function MyPage() {
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 border-b border-[#2d1e30]">
        <h1 className="text-[#ede0e8] text-base font-medium">マイページ</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-center">
          <Archive size={18} className="text-[#c48a9f] mx-auto mb-1.5" />
          <p className="text-[#ede0e8] text-xl font-semibold">
            {myCapsules.length}
          </p>
          <p className="text-[#7a6475] text-[10px] mt-0.5">投稿数</p>
        </div>
        <div className="bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-center">
          <Eye size={18} className="text-[#c48a9f] mx-auto mb-1.5" />
          <p className="text-[#ede0e8] text-xl font-semibold">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-[#7a6475] text-[10px] mt-0.5">開かれた回数</p>
        </div>
      </div>

      {/* My capsules */}
      <div className="px-4">
        <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-3">
          わたしのカプセル
        </p>
        <div className="grid grid-cols-2 gap-3">
          {myCapsules.map((c) => (
            <CapsuleCard key={c.id} capsule={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

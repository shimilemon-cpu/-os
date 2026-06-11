import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CapsuleCard from "@/components/CapsuleCard";
import { Eye, Archive } from "lucide-react";
import type { Capsule } from "@/lib/types";
import SignOutButton from "@/components/SignOutButton";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: capsules }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("capsules")
      .select("*, users(nickname, birth_year, gender)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Capsule[]>(),
  ]);

  const totalViews = (capsules ?? []).reduce((sum, c) => sum + c.views, 0);

  return (
    <div className="pb-24">
      <div className="px-4 pt-12 pb-4 border-b border-[#2d1e30] flex items-center justify-between">
        <div>
          <h1 className="text-[#ede0e8] text-base font-medium">
            {profile?.nickname ?? "マイページ"}
          </h1>
          {profile?.birth_year && (
            <p className="text-[#7a6475] text-xs mt-0.5">
              {new Date().getFullYear() - profile.birth_year}歳・{profile.gender}
            </p>
          )}
        </div>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-center">
          <Archive size={18} className="text-[#c48a9f] mx-auto mb-1.5" />
          <p className="text-[#ede0e8] text-xl font-semibold">{(capsules ?? []).length}</p>
          <p className="text-[#7a6475] text-[10px] mt-0.5">投稿数</p>
        </div>
        <div className="bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-center">
          <Eye size={18} className="text-[#c48a9f] mx-auto mb-1.5" />
          <p className="text-[#ede0e8] text-xl font-semibold">{totalViews.toLocaleString()}</p>
          <p className="text-[#7a6475] text-[10px] mt-0.5">開かれた回数</p>
        </div>
      </div>

      <div className="px-4">
        <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-3">
          わたしのカプセル
        </p>
        {(capsules ?? []).length === 0 ? (
          <p className="text-[#7a6475] text-sm text-center py-8">まだカプセルがありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(capsules ?? []).map((c) => (
              <CapsuleCard key={c.id} capsule={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

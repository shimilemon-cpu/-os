import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";
import type { Capsule } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: capsules } = await supabase
    .from("capsules")
    .select("*, users(nickname, birth_year, gender)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<Capsule[]>();

  return <HomeClient capsules={capsules ?? []} />;
}

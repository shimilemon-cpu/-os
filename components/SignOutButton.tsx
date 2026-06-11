"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <button onClick={signOut} className="text-[#7a6475] hover:text-[#b899a8] transition-colors">
      <LogOut size={18} />
    </button>
  );
}

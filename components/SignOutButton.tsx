"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <button onClick={handleSignOut} className="text-[#7a6475] hover:text-[#b899a8] transition-colors">
      <LogOut size={18} />
    </button>
  );
}

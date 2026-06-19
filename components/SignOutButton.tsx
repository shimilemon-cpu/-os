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
    <button onClick={handleSignOut} className="text-[var(--muted)] hover:text-[var(--accent-2)] transition-colors">
      <LogOut size={18} />
    </button>
  );
}

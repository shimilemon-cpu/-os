import PlayBottomNav from "@/components/play/PlayBottomNav";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffbf7] text-[#1c1410]">
      {children}
      <PlayBottomNav />
    </div>
  );
}

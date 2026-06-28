interface AdSlotProps {
  id: string;
  size?: "banner" | "rect";
  className?: string;
}

export default function AdSlot({ id, size = "banner", className = "" }: AdSlotProps) {
  return (
    <div
      id={id}
      data-ad-slot={id}
      className={`flex items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-700 text-[10px] tracking-widest ${className}`}
      style={{ height: size === "rect" ? 100 : 50 }}
    >
      広告
    </div>
  );
}

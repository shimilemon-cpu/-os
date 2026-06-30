interface AdSlotProps {
  id: string;
  size?: "banner" | "rect" | "interstitial";
  className?: string;
}

const SIZE_HEIGHT: Record<NonNullable<AdSlotProps["size"]>, number> = {
  banner: 50,
  rect: 100,
  interstitial: 280,
};

export default function AdSlot({ id, size = "banner", className = "" }: AdSlotProps) {
  return (
    <div
      id={id}
      data-ad-slot={id}
      className={`flex items-center justify-center border border-dashed rounded-xl text-text-faint text-[10px] tracking-widest ${className}`}
      style={{ borderColor: "#E4DCCF", height: SIZE_HEIGHT[size] }}
    >
      広告
    </div>
  );
}

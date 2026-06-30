type IconName = "home" | "grid" | "banzuke" | "person" | "search" | "back" | "refresh";

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export default function Icon({ name, size, color = "currentColor", strokeWidth, className }: Props) {
  const defaultSizes: Record<IconName, number> = {
    home: 23, grid: 23, banzuke: 23, person: 23,
    search: 18, back: 18, refresh: 22,
  };
  const defaultStrokes: Record<IconName, number> = {
    home: 2.1, grid: 2.1, banzuke: 2.1, person: 2.1,
    search: 2.2, back: 2.4, refresh: 2.1,
  };
  const s = size ?? defaultSizes[name];
  const sw = strokeWidth ?? defaultStrokes[name];

  const paths: Record<IconName, React.ReactElement> = {
    home: (
      <>
        <path d="M4 11l8-7 8 7"/>
        <path d="M6 10v9h12v-9"/>
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5"/>
        <rect x="13" y="4" width="7" height="7" rx="1.5"/>
        <rect x="4" y="13" width="7" height="7" rx="1.5"/>
        <rect x="13" y="13" width="7" height="7" rx="1.5"/>
      </>
    ),
    banzuke: (
      <path d="M7 21V9M12 21V4M17 21v-8"/>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4"/>
        <path d="M5 20c1.5-4 12.5-4 14 0"/>
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7"/>
        <path d="M21 21l-4-4"/>
      </>
    ),
    back: (
      <path d="M15 5l-7 7 7 7"/>
    ),
    refresh: (
      <>
        <path d="M4 12a8 8 0 1 1 2.3 5.6" strokeLinecap="round"/>
        <path d="M4 20v-5h5" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ),
  };

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

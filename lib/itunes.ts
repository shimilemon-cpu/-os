export interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  collectionName: string;
  previewUrl: string;
}

export async function searchMusic(query: string): Promise<ItunesTrack[]> {
  // 日本ストアと米国ストアの両方を検索して、より多くの候補を返す
  const stores = ["JP", "US"];
  const requests = stores.map(async (country) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&entity=song&limit=25&country=${country}`;
    const res = await fetch(url);
    if (!res.ok) return [] as ItunesTrack[];
    const data = await res.json();
    return (data.results ?? []) as ItunesTrack[];
  });

  const all = (await Promise.all(requests)).flat();

  // trackId で重複を除去
  const seen = new Set<number>();
  const unique: ItunesTrack[] = [];
  for (const track of all) {
    if (track.trackId && !seen.has(track.trackId)) {
      seen.add(track.trackId);
      unique.push(track);
    }
  }
  return unique.slice(0, 40);
}

export function extractYoutubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  // if it's already just an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return null;
}

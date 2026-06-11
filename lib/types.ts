export interface User {
  id: string;
  nickname: string;
  birth_year: number | null;
  gender: string | null;
  created_at: string;
}

export interface Capsule {
  id: string;
  user_id: string;
  memory_text: string;
  memory_year: number | null;
  life_stage: string | null;
  youtube_video_id: string | null;
  song_title: string | null;
  artist_name: string | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
  image_4: string | null;
  views: number;
  status: "draft" | "generating" | "published";
  created_at: string;
  users?: Pick<User, "nickname" | "birth_year" | "gender">;
}

export interface Draft {
  id: string;
  user_id: string;
  draft_data: Partial<PostData>;
  updated_at: string;
}

export interface PostData {
  memoryText: string;
  memoryYear: string;
  lifeStage: string;
  youtubeVideoId: string;
  songTitle: string;
  artistName: string;
  songArtwork: string;
  images: string[];
}

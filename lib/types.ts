export interface CapsuleDoc {
  id: string;
  userId: string;
  userNickname: string | null;
  userBirthYear: number | null;
  userGender: string | null;
  memoryText: string;
  memoryYear: number | null;
  lifeStage: string | null;
  youtubeVideoId: string | null;
  youtubeStart: number | null;
  songTitle: string | null;
  artistName: string | null;
  previewUrl: string | null;
  artworkUrl: string | null;
  images: string[];
  views: number;
  status: string;
  createdAt: { seconds: number } | null;
}

export interface UserDoc {
  id: string;
  nickname: string | null;
  birthYear: number | null;
  gender: string | null;
  region: string | null;
  envType: string | null;
}

export interface PostData {
  memoryText: string;
  memoryYear: string;
  lifeStage: string;
  youtubeVideoId: string;
  songTitle: string;
  artistName: string;
  images: string[];
}

import { doc, updateDoc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getStorageLazy } from "@/lib/firebase/client";
import type { UserDoc } from "@/lib/types";

export async function getProfile(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserDoc;
}

export async function updateProfile(
  uid: string,
  data: { nickname?: string; avatarIcon?: string | null; avatarUrl?: string | null },
) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, data);
  } else {
    await setDoc(ref, {
      nickname: data.nickname ?? null,
      avatarIcon: data.avatarIcon ?? null,
      avatarUrl: data.avatarUrl ?? null,
      createdAt: Timestamp.now(),
    });
  }
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const storage = await getStorageLazy();
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `avatars/${uid}/avatar_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

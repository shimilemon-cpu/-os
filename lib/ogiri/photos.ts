import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function stripExif(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/jpeg")) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const view = new DataView(reader.result as ArrayBuffer);
      if (view.getUint16(0) !== 0xFFD8) {
        resolve(file);
        return;
      }
      const pieces: ArrayBuffer[] = [];
      let offset = 2;
      pieces.push((reader.result as ArrayBuffer).slice(0, 2));
      while (offset < view.byteLength) {
        if (view.getUint8(offset) !== 0xFF) break;
        const marker = view.getUint16(offset);
        if (marker === 0xFFDA) {
          pieces.push((reader.result as ArrayBuffer).slice(offset));
          break;
        }
        const segLen = view.getUint16(offset + 2);
        // Skip APP1 (Exif) and APP2 (ICC profile if overly large)
        if (marker === 0xFFE1) {
          offset += 2 + segLen;
          continue;
        }
        pieces.push((reader.result as ArrayBuffer).slice(offset, offset + 2 + segLen));
        offset += 2 + segLen;
      }
      resolve(new Blob(pieces, { type: "image/jpeg" }));
    };
    reader.readAsArrayBuffer(file);
  });
}

export function validatePhoto(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "JPG / PNG / WebP のみ対応です";
  if (file.size > MAX_SIZE) return "5MB以下の画像を選んでください";
  return null;
}

export async function uploadRoomPhoto(
  roomId: string,
  roundIndex: number,
  file: File,
): Promise<string> {
  const stripped = await stripExif(file);
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `rooms/${roomId}/odai/${roundIndex}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, stripped, { contentType: file.type });
  return getDownloadURL(storageRef);
}

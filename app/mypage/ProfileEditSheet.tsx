"use client";

import { useState, useRef, useCallback } from "react";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";
import { updateProfile, uploadAvatar } from "@/lib/ogiri/profile";
import { validatePhoto } from "@/lib/ogiri/photos";

type EngimonoName = "daruma" | "cat" | "tai" | "fuku" | "koban" | "mallet" | "mask" | "tanuki" | "kitsune" | "usagi";

const AVATAR_ICONS: EngimonoName[] = [
  "daruma", "cat", "tai", "fuku", "koban",
  "mallet", "mask", "tanuki", "kitsune", "usagi",
];

interface Props {
  uid: string;
  initialNickname: string;
  initialAvatarIcon: EngimonoName | null;
  initialAvatarUrl: string | null;
  onClose: () => void;
  onSaved: (data: { nickname: string; avatarIcon: EngimonoName | null; avatarUrl: string | null }) => void;
}

export default function ProfileEditSheet({
  uid, initialNickname, initialAvatarIcon, initialAvatarUrl, onClose, onSaved,
}: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [selectedIcon, setSelectedIcon] = useState<EngimonoName | null>(initialAvatarIcon);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validatePhoto(file);
    if (err) { setError(err); return; }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadAvatar(uid, file);
      setAvatarUrl(url);
      setSelectedIcon(null);
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }, [uid]);

  const handleSave = useCallback(async () => {
    const trimmed = nickname.trim();
    if (!trimmed) { setError("名前を入力してください"); return; }
    setSaving(true);
    setError(null);
    try {
      await updateProfile(uid, {
        nickname: trimmed,
        avatarIcon: selectedIcon,
        avatarUrl: selectedIcon ? null : avatarUrl,
      });
      localStorage.setItem("ogiri_nickname", trimmed);
      onSaved({ nickname: trimmed, avatarIcon: selectedIcon, avatarUrl: selectedIcon ? null : avatarUrl });
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [uid, nickname, selectedIcon, avatarUrl, onSaved]);

  const selectIcon = (icon: EngimonoName) => {
    setSelectedIcon(icon);
    setAvatarUrl(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full bg-paper"
        style={{
          maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px calc(32px + env(safe-area-inset-bottom, 0px))",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,.15)" }} />
        </div>

        <p className="font-mincho font-extrabold text-[#1A1714] text-center mb-5" style={{ fontSize: 18 }}>
          プロフィール編集
        </p>

        {/* Current avatar preview */}
        <div className="flex justify-center mb-5">
          <div
            className="relative grid place-items-center"
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#F0EBE0",
              border: "3px solid #2BA35F",
              overflow: "hidden",
            }}
          >
            {selectedIcon ? (
              <Engimono name={selectedIcon} width={44} height={48} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Engimono name="fuku" width={44} height={48} />
            )}
          </div>
        </div>

        {/* Name input */}
        <label className="block mb-4">
          <span className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 13, marginBottom: 6, display: "block" }}>
            名前
          </span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            className="w-full font-gothic bg-white text-[#1A1714] outline-none"
            style={{
              fontSize: 15, padding: "12px 14px",
              borderRadius: 14,
              border: "1.5px solid rgba(0,0,0,.1)",
            }}
            placeholder="ニックネーム"
          />
          <span className="font-gothic text-sub block text-right" style={{ fontSize: 10, marginTop: 4 }}>
            {nickname.length}/12
          </span>
        </label>

        {/* Icon grid */}
        <p className="font-gothic font-extrabold text-[#1A1714] mb-2" style={{ fontSize: 13 }}>
          アイコン
        </p>
        <div className="grid grid-cols-5 gap-[10px] mb-4">
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              onClick={() => selectIcon(icon)}
              className="grid place-items-center aspect-square"
              style={{
                borderRadius: "50%",
                background: "#F0EBE0",
                border: selectedIcon === icon ? "2.5px solid #2BA35F" : "2.5px solid transparent",
                transition: "border-color 0.15s",
              }}
            >
              <Engimono name={icon} width={28} height={30} />
            </button>
          ))}
        </div>

        {/* Photo upload */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 font-gothic font-semibold"
          style={{
            fontSize: 13, padding: "12px 0",
            borderRadius: 14,
            border: "1.5px dashed rgba(0,0,0,.15)",
            background: "rgba(255,255,255,.5)",
            color: uploading ? "#B6AC97" : "#52493A",
          }}
        >
          <Icon name="plus" size={14} color={uploading ? "#B6AC97" : "#52493A"} strokeWidth={2} />
          {uploading ? "アップロード中..." : "写真をアップロード"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

        {/* Error */}
        {error && (
          <p className="font-gothic text-center mt-3" style={{ fontSize: 12, color: "#E5402F" }}>
            {error}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full font-gothic font-extrabold text-paper mt-4"
          style={{
            fontSize: 15, padding: "14px 0",
            borderRadius: 999, background: saving ? "#B6AC97" : "#E5402F",
            transition: "background 0.15s",
          }}
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}

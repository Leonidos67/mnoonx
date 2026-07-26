import React, { useMemo, useRef, useState } from 'react';
import { Camera, Check, Upload, X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import {
  AVATAR_LINEAR_PRESETS,
  AVATAR_PRESET_COLORS,
  AVATAR_PRESET_EMOJIS,
  AVATAR_RADIAL_PRESETS,
  buildAvatarDataUrl,
  cssPreviewForFill,
  type AvatarFill,
  type AvatarFillStyle,
} from '../../constants/avatarPresets';
import { USERS_API } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (avatarUrl: string) => void;
  currentAvatar?: string | null;
  displayName?: string;
}

function normalizeHexInput(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toLowerCase()}`;
  return value;
}

const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (hex: string) => void;
  onInteract?: () => void;
}> = ({ label, value, onChange, onInteract }) => (
  <label className="flex min-w-0 flex-1 flex-col gap-1.5">
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1.5">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#171717'}
        onChange={(e) => {
          onInteract?.();
          onChange(e.target.value);
        }}
        className="h-8 w-8 cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent p-0"
        aria-label={label}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onInteract?.();
          onChange(normalizeHexInput(e.target.value));
        }}
        maxLength={7}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-neutral-800 outline-none"
        placeholder="#315efb"
      />
    </div>
  </label>
);

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  open,
  onClose,
  onSaved,
  currentAvatar,
  displayName = 'U',
}) => {
  const { t } = useTranslation();
  const { token, user, setUser } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fillStyle, setFillStyle] = useState<AvatarFillStyle>('solid');
  const [colorA, setColorA] = useState<string>(AVATAR_PRESET_COLORS[1]);
  const [colorB, setColorB] = useState<string>(AVATAR_PRESET_COLORS[4]);
  const [angle, setAngle] = useState(135);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(AVATAR_PRESET_EMOJIS[0]);
  const [busy, setBusy] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);

  const fill: AvatarFill = useMemo(() => {
    if (fillStyle === 'solid') return { type: 'solid', color: colorA };
    if (fillStyle === 'linear') return { type: 'linear', colorA, colorB, angle };
    return { type: 'radial', colorA, colorB };
  }, [fillStyle, colorA, colorB, angle]);

  const fallback =
    currentAvatar && currentAvatar.trim()
      ? resolveMediaUrl(currentAvatar)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=171717&color=fff&size=160&bold=true`;

  const presetPreview = buildAvatarDataUrl({
    fill,
    emoji: selectedEmoji,
    rounded: !selectedEmoji,
  });
  const previewSrc = previewOverride || presetPreview;

  const applyAvatar = async (avatarValue: string, fromFile?: File) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    setBusy(true);
    try {
      let res: Response;
      if (fromFile) {
        const form = new FormData();
        form.append('avatar', fromFile);
        res = await fetch(`${USERS_API}/me/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      } else {
        res = await fetch(`${USERS_API}/me/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar: avatarValue }),
        });
      }
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        avatar?: string;
      };
      if (!res.ok) {
        showToast(data.message || t('settings.avatarSaveFailed'), 'error');
        return;
      }
      const nextAvatar = data.avatar || avatarValue;
      if (user) setUser({ ...user, avatar: nextAvatar });
      onSaved?.(nextAvatar);
      showToast(t('settings.avatarSaveSuccess'));
      setPreviewOverride(null);
      onClose();
    } catch {
      showToast(t('settings.avatarSaveFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(t('settings.avatarInvalidFile'), 'error');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewOverride(objectUrl);
    void applyAvatar('', file).finally(() => {
      URL.revokeObjectURL(objectUrl);
    });
  };

  const setFillTab = (next: AvatarFillStyle) => {
    setFillStyle(next);
    setPreviewOverride(null);
    if (next === 'linear' && colorA === colorB) {
      setColorB(AVATAR_PRESET_COLORS[4]);
    }
  };

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={t('settings.avatarPickerTitle')}
      sheetPadded
      panelClassName="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-5 shadow-xl sm:p-6"
      zIndexClass="z-[140]"
      disableClose={busy}
    >
      <div className="relative max-h-[min(82dvh,40rem)] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-0 top-0 z-10 hidden h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 lg:flex"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <h2 className="pr-10 text-center text-lg font-bold text-neutral-900 lg:text-left">
          {t('settings.avatarPickerTitle')}
        </h2>
        <p className="mt-1 text-center text-sm text-neutral-500 lg:text-left">
          {t('settings.avatarPickerHint')}
        </p>

        <div className="mt-5 flex flex-col items-center">
          <div className="relative">
            <img
              src={previewSrc || fallback}
              alt=""
              className="h-28 w-28 rounded-full border border-neutral-200 object-cover shadow-sm"
            />
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow">
              <Camera className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" aria-hidden />
          {t('settings.avatarUpload')}
        </button>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {t('settings.avatarFillStyle')}
        </p>
        <div className="mt-2 flex rounded-xl bg-neutral-100 p-1">
          {(
            [
              ['solid', 'avatarTabSolid'],
              ['linear', 'avatarTabGradient'],
              ['radial', 'avatarTabRadial'],
            ] as const
          ).map(([id, key]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFillTab(id)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
                fillStyle === id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              {t(`settings.${key}`)}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <ColorField
            label={fillStyle === 'solid' ? t('settings.avatarColor') : t('settings.avatarColorA')}
            value={colorA}
            onChange={setColorA}
            onInteract={() => setPreviewOverride(null)}
          />
          {fillStyle !== 'solid' ? (
            <ColorField
              label={t('settings.avatarColorB')}
              value={colorB}
              onChange={setColorB}
              onInteract={() => setPreviewOverride(null)}
            />
          ) : null}
        </div>

        {fillStyle === 'linear' ? (
          <label className="mt-3 block">
            <span className="text-xs font-medium text-neutral-500">
              {t('settings.avatarAngle')}: {angle}°
            </span>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => {
                setAngle(Number(e.target.value));
                setPreviewOverride(null);
              }}
              className="mt-2 w-full accent-black"
            />
          </label>
        ) : null}

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {t('settings.avatarPresets')}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {fillStyle === 'solid'
            ? AVATAR_PRESET_COLORS.map((color) => {
                const active = colorA.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setColorA(color);
                      setPreviewOverride(null);
                    }}
                    className={`relative aspect-square rounded-2xl border-2 ${
                      active ? 'border-neutral-900' : 'border-neutral-200'
                    }`}
                    style={{ background: color }}
                    aria-label={color}
                  >
                    {active ? (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" aria-hidden />
                    ) : null}
                  </button>
                );
              })
            : null}

          {fillStyle === 'linear'
            ? AVATAR_LINEAR_PRESETS.map((p, i) => {
                const active =
                  colorA.toLowerCase() === p.colorA.toLowerCase() &&
                  colorB.toLowerCase() === p.colorB.toLowerCase() &&
                  angle === p.angle;
                return (
                  <button
                    key={`lin-${i}`}
                    type="button"
                    onClick={() => {
                      setColorA(p.colorA);
                      setColorB(p.colorB);
                      setAngle(p.angle);
                      setPreviewOverride(null);
                    }}
                    className={`aspect-square rounded-2xl border-2 ${
                      active ? 'border-neutral-900' : 'border-neutral-200'
                    }`}
                    style={{
                      background: cssPreviewForFill({
                        type: 'linear',
                        colorA: p.colorA,
                        colorB: p.colorB,
                        angle: p.angle,
                      }),
                    }}
                  />
                );
              })
            : null}

          {fillStyle === 'radial'
            ? AVATAR_RADIAL_PRESETS.map((p, i) => {
                const active =
                  colorA.toLowerCase() === p.colorA.toLowerCase() &&
                  colorB.toLowerCase() === p.colorB.toLowerCase();
                return (
                  <button
                    key={`rad-${i}`}
                    type="button"
                    onClick={() => {
                      setColorA(p.colorA);
                      setColorB(p.colorB);
                      setPreviewOverride(null);
                    }}
                    className={`aspect-square rounded-2xl border-2 ${
                      active ? 'border-neutral-900' : 'border-neutral-200'
                    }`}
                    style={{
                      background: cssPreviewForFill({
                        type: 'radial',
                        colorA: p.colorA,
                        colorB: p.colorB,
                      }),
                    }}
                  />
                );
              })
            : null}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {t('settings.avatarEmojis')}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedEmoji(null);
              setPreviewOverride(null);
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              selectedEmoji == null
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {t('settings.avatarNoEmoji')}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {AVATAR_PRESET_EMOJIS.map((emoji) => {
            const src = buildAvatarDataUrl({ fill, emoji });
            const active = selectedEmoji === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setSelectedEmoji(emoji);
                  setPreviewOverride(null);
                }}
                className={`aspect-square overflow-hidden rounded-2xl border-2 transition-transform ${
                  active ? 'scale-[1.03] border-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <img src={src} alt={emoji} className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void applyAvatar(presetPreview)}
          className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50"
        >
          {busy ? t('common.saving') : t('settings.avatarUsePreset')}
        </button>
      </div>
    </ResponsiveDialogShell>
  );
};

export default AvatarPickerModal;

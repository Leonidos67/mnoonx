import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, Loader2, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { MAX_POST_MEDIA, uploadPostMediaFiles } from '../../utils/postMedia';

export interface PostMediaUploadHandle {
  openPicker: () => void;
}

interface PostMediaUploadProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  token: string | null;
  maxCount?: number;
  compact?: boolean;
  hideAddButton?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

const PostMediaUpload = forwardRef<PostMediaUploadHandle, PostMediaUploadProps>(({
  urls,
  onUrlsChange,
  token,
  maxCount = MAX_POST_MEDIA,
  compact = false,
  hideAddButton = false,
  onUploadingChange,
}, ref) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    openPicker: () => inputRef.current?.click(),
  }));

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;

    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    const slotsLeft = maxCount - urls.length;
    if (slotsLeft <= 0) {
      setError(t('postMedia.maxImages', { count: maxCount }));
      return;
    }

    const batch = picked.slice(0, slotsLeft);
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadPostMediaFiles(token, batch);
      onUrlsChange([...urls, ...uploaded]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('postMedia.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    onUrlsChange(urls.filter((_, i) => i !== index));
  };

  const thumbClass = compact ? 'w-14 h-14' : 'w-16 h-16';

  return (
    <div className="space-y-2">
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, index) => (
            <div key={`${url}-${index}`} className={`relative ${thumbClass} rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100`}>
              <img
                src={resolveMediaUrl(url)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                aria-label={t('postMedia.removeImage')}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void handlePick(e)}
      />

      {urls.length < maxCount && !hideAddButton && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`inline-flex items-center gap-2 rounded-full transition-colors text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 ${
            compact ? 'p-2' : 'px-3 py-2 text-sm'
          }`}
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Image size={18} />}
          {!compact && <span>{uploading ? t('postMedia.uploading') : t('postMedia.addPhotos')}</span>}
        </button>
      )}
    </div>
  );
});

PostMediaUpload.displayName = 'PostMediaUpload';

export default PostMediaUpload;

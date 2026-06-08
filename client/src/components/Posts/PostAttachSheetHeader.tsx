import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface PostAttachSheetHeaderProps {
  title: string;
  onBack: () => void;
}

const PostAttachSheetHeader: React.FC<PostAttachSheetHeaderProps> = ({ title, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 transition-colors hover:bg-neutral-200 active:bg-neutral-300"
        aria-label={t('common.back')}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </button>
      <h2 className="min-w-0 flex-1 text-lg font-semibold text-neutral-900">{title}</h2>
    </div>
  );
};

export default PostAttachSheetHeader;

import React from 'react';
import { motion } from 'framer-motion';
import { CandlestickChart, File, Image, Smile, Sticker, X, type LucideIcon } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export type AttachmentMenuAction =
  | 'documents'
  | 'media'
  | 'animated-emoji'
  | 'stickers'
  | 'coin'
  | 'close';

interface MessengerAttachmentMenuProps {
  onSelect: (action: AttachmentMenuAction) => void;
  onDocumentsSelected?: (files: FileList) => void;
  onMediaSelected?: (files: FileList) => void;
}

const rowClass =
  'flex w-full cursor-pointer items-center gap-6 whitespace-nowrap text-lg font-medium text-neutral-900 outline-none select-none focus-visible:outline-none [&_svg]:shrink-0';

const iconBadgeClass =
  'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full';

function MenuIconBadge({
  icon: Icon,
  bgClassName,
  iconClassName = 'text-white',
}: {
  icon: LucideIcon;
  bgClassName: string;
  iconClassName?: string;
}) {
  return (
    <span className={`${iconBadgeClass} ${bgClassName}`} aria-hidden>
      <Icon className={iconClassName} size={20} strokeWidth={2} />
    </span>
  );
}

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 480, damping: 30 },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.1 } },
};

const MessengerAttachmentMenu: React.FC<MessengerAttachmentMenuProps> = ({
  onSelect,
  onDocumentsSelected,
  onMediaSelected,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      role="dialog"
      aria-label="Attach"
      className="pointer-events-none absolute bottom-full left-0 z-[4] mb-1 origin-bottom-left contain-layout"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div className="pointer-events-auto flex flex-col gap-6" variants={listVariants}>
        <motion.label className={rowClass} variants={itemVariants}>
          <input
            accept=".pdf,.zip,.txt,.docx"
            className="hidden"
            multiple
            type="file"
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) onDocumentsSelected?.(files);
              e.target.value = '';
              onSelect('documents');
            }}
          />
          <MenuIconBadge
            icon={File}
            bgClassName="bg-gradient-to-br from-violet-400 to-indigo-600"
          />
          {t('messenger.attachmentMenu.documents')}
        </motion.label>

        <motion.label className={rowClass} variants={itemVariants}>
          <input
            accept="image/*,video/*,audio/*"
            className="hidden"
            multiple
            type="file"
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) onMediaSelected?.(files);
              e.target.value = '';
              onSelect('media');
            }}
          />
          <MenuIconBadge icon={Image} bgClassName="bg-gradient-to-br from-emerald-400 to-green-600" />
          {t('messenger.attachmentMenu.media')}
        </motion.label>

        <motion.button
          type="button"
          className={rowClass}
          variants={itemVariants}
          onClick={() => onSelect('animated-emoji')}
        >
          <MenuIconBadge
            icon={Smile}
            bgClassName="bg-gradient-to-br from-fuchsia-400 to-violet-600"
          />
          {t('messenger.attachmentMenu.animatedEmoji')}
        </motion.button>

        <motion.button
          type="button"
          className={rowClass}
          variants={itemVariants}
          onClick={() => onSelect('stickers')}
        >
          <MenuIconBadge
            icon={Sticker}
            bgClassName="bg-gradient-to-br from-amber-400 to-orange-500"
          />
          {t('messenger.attachmentMenu.stickers')}
        </motion.button>

        <motion.button
          type="button"
          className={rowClass}
          variants={itemVariants}
          onClick={() => onSelect('coin')}
        >
          <MenuIconBadge
            icon={CandlestickChart}
            bgClassName="bg-gradient-to-br from-sky-400 to-blue-600"
          />
          {t('messenger.attachmentMenu.coin')}
        </motion.button>

        <motion.button type="button" className={rowClass} variants={itemVariants} onClick={() => onSelect('close')}>
          <MenuIconBadge icon={X} bgClassName="bg-neutral-200" iconClassName="text-neutral-500" />
          {t('messenger.attachmentMenu.close')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default MessengerAttachmentMenu;

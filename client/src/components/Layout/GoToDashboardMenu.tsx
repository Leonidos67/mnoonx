import React, { useCallback, useEffect, useRef, useState } from 'react';
import FloatingMenu from '../Common/FloatingMenu';
import DashboardCommunityPickerList from './DashboardCommunityPickerList';
import DashboardPickerModal from './DashboardPickerModal';
import { useMyCommunities } from '../../hooks/useMyCommunities';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from '../../i18n/useTranslation';

const LG_MEDIA = '(min-width: 1024px)';

const GoToDashboardMenu: React.FC = () => {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(LG_MEDIA);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ rect: DOMRect } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { communities, loading, reload } = useMyCommunities(false);

  const close = useCallback(() => {
    setOpen(false);
    setAnchor(null);
  }, []);

  const openPicker = useCallback(() => {
    if (isDesktop && buttonRef.current) {
      setAnchor({ rect: buttonRef.current.getBoundingClientRect() });
    }
    setOpen(true);
    void reload();
  }, [isDesktop, reload]);

  const toggle = () => {
    if (open) close();
    else openPicker();
  };

  useEffect(() => {
    if (!isDesktop) setAnchor(null);
  }, [isDesktop]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95] sm:px-4"
      >
        {t('goToDashboard.label')}
      </button>

      {isDesktop && (
        <FloatingMenu open={open} anchor={anchor} onClose={close} width={280}>
          <p className="border-b border-neutral-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {t('goToDashboard.menuHeading')}
          </p>
          <DashboardCommunityPickerList
            communities={communities}
            loading={loading}
            onSelect={close}
          />
        </FloatingMenu>
      )}

      {!isDesktop && (
        <DashboardPickerModal isOpen={open} onClose={close} />
      )}
    </>
  );
};

export default GoToDashboardMenu;

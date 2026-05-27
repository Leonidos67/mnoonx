import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
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
        className="inline-flex shrink-0 items-center justify-center rounded-full border text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95] max-lg:h-10 max-lg:w-10 max-lg:p-0 lg:px-4 lg:py-2 lg:text-sm lg:font-medium"
        aria-label={t('goToDashboard.label')}
      >
        <LayoutDashboard className="h-5 w-5 lg:hidden" aria-hidden />
        <span className="hidden lg:inline">{t('goToDashboard.label')}</span>
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

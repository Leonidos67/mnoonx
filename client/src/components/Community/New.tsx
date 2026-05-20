import React from 'react';
import { User, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

const NewPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-[760px]">
            <h1 className="mb-12 text-center text-[52px] font-semibold tracking-[-0.04em] text-black">
              {t('newPage.createHeading')}
            </h1>

            <div className="flex flex-col gap-6">
              <Link
                to="/new/personal"
                className="group rounded-[32px] border border-[#e5e5e5] bg-white p-7 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-[#f3f3f3] text-black">
                      <User size={28} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-black">
                        {t('newPage.personalTitle')}
                      </h2>
                      <p className="mt-1 text-[15px] text-[#666]">{t('newPage.personalDesc')}</p>
                    </div>
                  </div>
                  <div className="text-[#999] transition group-hover:text-black">
                    <ArrowRight size={28} />
                  </div>
                </div>
              </Link>

              <Link
                to="/new/business"
                className="group rounded-[32px] border border-[#e5e5e5] bg-white p-7 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-[#f3f3f3] text-black">
                      <Briefcase size={28} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-black">
                        {t('newPage.businessTitle')}
                      </h2>
                      <p className="mt-1 text-[15px] text-[#666]">{t('newPage.businessDesc')}</p>
                    </div>
                  </div>
                  <div className="text-[#999] transition group-hover:text-black">
                    <ArrowRight size={28} />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPage;

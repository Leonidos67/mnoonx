import React from 'react';
import { Briefcase, Users2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

const NewPage: React.FC = () => {
  const { t } = useTranslation();
  const sizes = [56, 72, 96, 72, 56];
  const avatars = [
    'https://i.ibb.co/tPLMnXKx/image-Photoroom.png',
    'https://i.ibb.co/bg4HtTCm/image-Photoroom-1.png',
    'https://i.ibb.co/Q3L2rwHm/image-Photoroom-3.png',
    'https://i.ibb.co/p6bdjGc1/image-Photoroom-2.png',
    'https://i.ibb.co/ZpNmwDrg/image-Photoroom-4.png',
  ];
  const animationStyles = [
    {
      animation: 'fadeLeft 0.5s ease-out forwards',
      animationDelay: '0.5s',
      opacity: 0,
    },
    {
      animation: 'fadeCenterLeft 0.5s ease-out forwards',
      animationDelay: '0.5s',
      opacity: 0,
    },
    {
      animation: 'fadeCenter 0.5s ease-out forwards',
      opacity: 0,
    },
    {
      animation: 'fadeCenterRight 0.5s ease-out forwards',
      animationDelay: '0.5s',
      opacity: 0,
    },
    {
      animation: 'fadeRight 0.5s ease-out forwards',
      animationDelay: '0.5s',
      opacity: 0,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeCenter {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeCenterLeft {
          from { opacity: 0; transform: translateX(40px) scale(0.7); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeCenterRight {
          from { opacity: 0; transform: translateX(-40px) scale(0.7); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(80px) scale(0.7); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(-80px) scale(0.7); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
            <div className="w-full max-w-[760px]">
              <div className="mb-0 flex items-end justify-center gap-1 sm:gap-3">
                {avatars.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt=""
                    className="rounded-full border-4 border-white object-cover shadow-md transition-all duration-300"
                    style={{
                      width: `${sizes[index]}px`,
                      height: `${sizes[index]}px`,
                      ...animationStyles[index],
                    }}
                  />
                ))}
              </div>

              <h1 className="mb-4 text-center text-[52px] font-semibold tracking-[-0.04em] text-black">
                {t('newPage.createHeading')}
              </h1>

              <div className="flex flex-col gap-6">
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

                <Link
                  to="/create-collaboration"
                  className="group rounded-[32px] border border-[#e5e5e5] bg-white p-7 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]">
                        <Users2 size={28} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-black">
                          {t('newPage.collabTitle')}
                        </h2>
                        <p className="mt-1 text-[15px] text-[#666]">{t('newPage.collabDesc')}</p>
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
    </>
  );
};

export default NewPage;

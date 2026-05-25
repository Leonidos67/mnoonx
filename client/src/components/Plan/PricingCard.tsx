import React from 'react';
import {
  Sparkles,
  MessageCircle,
  Brain,
  TrendingUp,
  LayoutTemplate,
  BarChart3,
  Users,
  DollarSign,
  Palette,
  Rocket,
  LineChart,
  Wallet,
  Globe,
  Headphones,
  Code,
  Database,
  Check,
  type LucideIcon,
} from 'lucide-react';
import type { PlanBillingPeriod, PlanTierId } from '../../constants/planTiers';
import { planDisplayMonthlyUsd } from '../../constants/planTiers';

const FEATURE_ICONS: Record<string, LucideIcon> = {
  profilePosts: MessageCircle,
  publicCommunities: Users,
  basicFeed: TrendingUp,
  aiBasic: Sparkles,
  higherLimits: MessageCircle,
  smartFeed: TrendingUp,
  postTemplates: LayoutTemplate,
  profileAnalytics: BarChart3,
  threeCommunities: Users,
  allPro: Check,
  tenCommunities: Users,
  communityMonetization: DollarSign,
  customBranding: Palette,
  postBoost: Rocket,
  exclusiveAi: Brain,
  communityAnalytics: LineChart,
  payouts: Wallet,
  allCreator: Check,
  unlimitedCommunities: Users,
  whiteLabel: Globe,
  prioritySupport: Headphones,
  apiAccess: Code,
  higherStorage: Database,
};

export interface PricingCardProps {
  tier: PlanTierId;
  billing: PlanBillingPeriod;
  featureKeys: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  popularLabel: string;
  name: string;
  subtitle: string;
  perMonthLabel: string;
  yearlyBilledNote?: string;
  priceFromLabel: string;
  currentPlanLabel: string;
  ctaLabel: string;
  featureLabel: (key: string) => string;
  onSelect: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  billing,
  featureKeys,
  isPopular = false,
  isCurrent = false,
  popularLabel,
  name,
  subtitle,
  perMonthLabel,
  yearlyBilledNote,
  priceFromLabel,
  currentPlanLabel,
  ctaLabel,
  featureLabel,
  onSelect,
}) => {
  const monthlyDisplay = planDisplayMonthlyUsd(tier, billing);
  const showFrom = tier === 'community' && billing === 'monthly';

  const buttonClass = isCurrent
    ? 'border border-neutral-300 bg-white text-neutral-700 cursor-default'
    : isPopular
      ? 'bg-[#315efb] text-white hover:bg-[#2748c9]'
      : 'bg-neutral-900 text-white hover:bg-neutral-800';

  return (
    <article
      className={`relative flex min-h-[520px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
        isPopular ? 'border-[#315efb]/40 ring-1 ring-[#315efb]/20' : 'border-neutral-200'
      }`}
    >
      {isPopular && (
        <span className="absolute right-4 top-4 rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-semibold text-[#315efb]">
          {popularLabel}
        </span>
      )}

      <div className="pr-16">
        <h2 className="text-xl font-bold text-neutral-900">{name}</h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-1">
          {showFrom && (
            <span className="text-sm font-medium text-neutral-500">{priceFromLabel}</span>
          )}
          <span className="text-4xl font-bold tracking-tight text-neutral-900">
            ${monthlyDisplay}
          </span>
          <span className="text-sm text-neutral-500">{perMonthLabel}</span>
        </div>
        {yearlyBilledNote ? <p className="mt-1 text-xs text-neutral-500">{yearlyBilledNote}</p> : null}
        <p className="mt-3 text-sm text-neutral-600">{subtitle}</p>
      </div>

      <button
        type="button"
        disabled={isCurrent}
        onClick={onSelect}
        className={`mt-6 w-full rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-100 ${buttonClass}`}
      >
        {isCurrent ? currentPlanLabel : ctaLabel}
      </button>

      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-neutral-100 pt-6">
        {featureKeys.map((key) => {
          const Icon = FEATURE_ICONS[key] ?? Sparkles;
          return (
            <li key={key} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span>{featureLabel(key)}</span>
            </li>
          );
        })}
      </ul>
    </article>
  );
};

export default PricingCard;

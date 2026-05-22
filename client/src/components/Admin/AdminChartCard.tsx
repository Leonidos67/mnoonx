import React from 'react';

interface AdminChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AdminChartCard: React.FC<AdminChartCardProps> = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-white/10 bg-[#141820] p-5">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
    <div className="mt-4">{children}</div>
  </div>
);

export default AdminChartCard;

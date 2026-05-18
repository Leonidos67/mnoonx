import React from 'react';

interface StatusBadgeProps {
  status: 'open' | 'pending' | 'escalated' | 'resolved';
  text?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const statusClasses = {
    open: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    escalated: 'bg-red-100 text-red-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const statusMap = {
    open: 'Открыта',
    pending: 'В ожидании',
    escalated: 'Эскалирована',
    resolved: 'Решена',
  };
  
  const statusText = text || statusMap[status];

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
      {statusText}
    </span>
  );
};

export default StatusBadge;
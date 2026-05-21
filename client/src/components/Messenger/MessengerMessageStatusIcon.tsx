import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export type MessengerMessageStatus = 'sent' | 'delivered' | 'read';

interface MessengerMessageStatusIconProps {
  status: MessengerMessageStatus;
  className?: string;
  labels: {
    sent: string;
    delivered: string;
    read: string;
  };
}

const MessengerMessageStatusIcon: React.FC<MessengerMessageStatusIconProps> = ({
  status,
  className = 'h-3.5 w-3.5',
  labels,
}) => {
  switch (status) {
    case 'sent':
      return <Check className={className} aria-label={labels.sent} />;
    case 'delivered':
      return <CheckCheck className={`${className} text-neutral-400`} aria-label={labels.delivered} />;
    case 'read':
      return <CheckCheck className={`${className} text-blue-500`} aria-label={labels.read} />;
    default:
      return null;
  }
};

export default MessengerMessageStatusIcon;

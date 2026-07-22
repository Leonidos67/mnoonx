import React from 'react';

export type SupportBotAction = {
  id: string;
  label: string;
};

type MessengerSupportBotActionsProps = {
  actions: SupportBotAction[];
  disabled?: boolean;
  busyActionId?: string | null;
  onAction: (actionId: string) => void;
};

/** Quick-reply buttons under Mnoonx Support bot messages. */
const MessengerSupportBotActions: React.FC<MessengerSupportBotActionsProps> = ({
  actions,
  disabled,
  busyActionId,
  onAction,
}) => {
  if (!actions?.length) return null;

  return (
    <div className="mt-2 flex max-w-[min(100%,22rem)] flex-wrap gap-1.5">
      {actions.map((action) => {
        const busy = busyActionId === action.id;
        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled || Boolean(busyActionId)}
            onClick={() => onAction(action.id)}
            className="rounded-full border border-[#c7d2fe] bg-white px-3 py-1.5 text-left text-[13px] font-medium text-[#3730a3] shadow-sm transition-colors hover:border-[#818cf8] hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? '…' : action.label}
          </button>
        );
      })}
    </div>
  );
};

export default MessengerSupportBotActions;

import React from 'react';

type SettingsToggleRowProps = {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

/** Label + description + switch for settings pages. */
const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled,
}) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <div className="min-w-0 flex-1">
      <p className="font-medium text-neutral-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
    </div>
    <label className="relative inline-flex shrink-0 cursor-pointer items-center pt-0.5">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all peer-checked:bg-black peer-checked:after:translate-x-full peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/10" />
    </label>
  </div>
);

export default SettingsToggleRow;

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type StyledSelectOption = {
  value: string;
  label: string;
};

type StyledSelectProps = {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

/** Custom dropdown matching form controls (rounded-xl, white panel). */
const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-[50px] w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-[15px] transition-colors ${
          open
            ? 'border-neutral-400 ring-2 ring-black/5'
            : 'border-neutral-200 hover:border-neutral-300'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span className={selected ? 'truncate text-neutral-900' : 'truncate text-neutral-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[15px] transition-colors ${
                    active
                      ? 'bg-neutral-100 font-medium text-neutral-900'
                      : 'text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-neutral-700" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StyledSelect;

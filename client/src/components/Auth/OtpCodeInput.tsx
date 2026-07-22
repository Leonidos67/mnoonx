import React, { useCallback, useEffect, useRef } from 'react';

const LENGTH = 6;

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  'aria-label'?: string;
}

const cellClass = (active: boolean, hasError: boolean) =>
  [
    'h-12 w-10 shrink-0 rounded-xl border text-center text-lg font-semibold tabular-nums outline-none transition-colors sm:h-14 sm:w-11 sm:text-xl',
    hasError
      ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : active
        ? 'border-[#315efb] bg-white text-neutral-900 ring-2 ring-[#315efb]/20'
        : 'border-gray-200 bg-white text-neutral-900 focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/20',
  ].join(' ');

const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  error = false,
  'aria-label': ariaLabel = 'One-time code',
}) => {
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || '');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = useCallback((index: number) => {
    const el = refs.current[Math.max(0, Math.min(LENGTH - 1, index))];
    el?.focus();
    el?.select();
  }, []);

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusAt(0);
    }
  }, [autoFocus, disabled, focusAt]);

  const setDigits = (next: string[]) => {
    onChange(next.join('').replace(/\D/g, '').slice(0, LENGTH));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const next = [...digits];
      const chars = cleaned.slice(0, LENGTH - index).split('');
      chars.forEach((ch, offset) => {
        next[index + offset] = ch;
      });
      setDigits(next);
      focusAt(Math.min(LENGTH - 1, index + chars.length));
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (index < LENGTH - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        return;
      }
      if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: LENGTH }, (_, i) => pasted[i] || '');
    setDigits(next);
    focusAt(Math.min(LENGTH - 1, pasted.length));
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="mb-6 flex items-center justify-center gap-2 sm:gap-2.5"
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabel} digit ${index + 1}`}
          className={cellClass(Boolean(digit), error)}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
};

export default OtpCodeInput;

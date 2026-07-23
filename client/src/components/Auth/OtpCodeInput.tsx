import React from 'react';
import { VerificationCodeInput } from '../Common/PinInput/pinInput';

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  'aria-label'?: string;
}

/** Auth / 2FA OTP field — Untitled UI PinInput over `input-otp`. */
const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  error = false,
  'aria-label': ariaLabel,
}) => {
  return (
    <VerificationCodeInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus={autoFocus}
      invalid={error}
      size="sm"
      maxLength={6}
      withSeparator
      aria-label={ariaLabel}
      className="mb-6"
    />
  );
};

export default OtpCodeInput;

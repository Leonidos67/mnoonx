import React, {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import { cx } from '../../../utils/cx';

type PinInputSize = 'xxxs' | 'xxs' | 'xs' | 'sm' | 'md' | 'lg';

type PinInputContextType = {
  size: PinInputSize;
  disabled: boolean;
  id: string;
  invalid: boolean;
};

const PinInputContext = createContext<PinInputContextType>({
  size: 'sm',
  id: '',
  disabled: false,
  invalid: false,
});

export const usePinInputContext = () => {
  const context = useContext(PinInputContext);
  if (!context) {
    throw new Error("The 'usePinInputContext' hook must be used within a '<PinInput />'");
  }
  return context;
};

interface RootProps extends ComponentPropsWithRef<'div'> {
  size?: PinInputSize;
  disabled?: boolean;
  invalid?: boolean;
}

const Root = ({ className, size = 'md', disabled = false, invalid = false, ...props }: RootProps) => {
  const id = useId();
  return (
    <PinInputContext.Provider value={{ size, disabled, id, invalid }}>
      <div role="group" className={cx('flex h-max flex-col gap-1.5', className)} {...props} />
    </PinInputContext.Provider>
  );
};
Root.displayName = 'Root';

const styles: Record<PinInputSize, { group: string; slot: string; caret: string }> = {
  xxxs: {
    group: 'gap-1.5',
    slot: 'size-9 rounded-lg text-sm font-medium',
    caret: 'text-sm font-medium',
  },
  xxs: {
    group: 'gap-2',
    slot: 'size-10 rounded-lg text-base font-medium',
    caret: 'text-base font-medium',
  },
  xs: {
    group: 'gap-2',
    slot: 'size-11 rounded-lg text-base font-medium',
    caret: 'text-base font-medium',
  },
  sm: {
    group: 'gap-2',
    slot: 'h-12 w-10 rounded-xl text-lg font-semibold sm:h-14 sm:w-11 sm:text-xl',
    caret: 'text-lg font-semibold sm:text-xl',
  },
  md: {
    group: 'gap-2.5 sm:gap-3',
    slot: 'size-14 rounded-xl text-2xl font-semibold sm:size-16',
    caret: 'text-2xl font-semibold',
  },
  lg: {
    group: 'gap-3',
    slot: 'size-20 rounded-xl text-3xl font-semibold',
    caret: 'text-3xl font-semibold',
  },
};

type GroupProps = ComponentPropsWithRef<typeof OTPInput> & {
  width?: number;
  inputClassName?: string;
};

const Group = ({
  inputClassName,
  containerClassName,
  width,
  maxLength = 4,
  'aria-label': ariaLabel,
  ...props
}: GroupProps) => {
  const { id, size, disabled } = usePinInputContext();
  return (
    <OTPInput
      {...props}
      size={width}
      maxLength={maxLength}
      disabled={disabled}
      id={'pin-input-' + id}
      aria-label={ariaLabel || 'Enter your pin'}
      aria-labelledby={'pin-input-label-' + id}
      aria-describedby={'pin-input-description-' + id}
      containerClassName={cx('flex flex-row items-center', styles[size].group, containerClassName)}
      className={cx('disabled:cursor-not-allowed', inputClassName)}
    />
  );
};
Group.displayName = 'Group';

const Slot = ({
  index,
  className,
  ...props
}: ComponentPropsWithRef<'div'> & { index: number }) => {
  const { size, disabled, invalid } = usePinInputContext();
  const { slots, isFocused } = useContext(OTPInputContext);
  const slot = slots[index];

  return (
    <div
      {...props}
      aria-invalid={invalid || undefined}
      aria-label={'Enter digit ' + (index + 1) + ' of ' + slots.length}
      className={cx(
        'relative flex items-center justify-center bg-white text-center text-neutral-300 shadow-sm ring-1 ring-inset ring-neutral-200 transition-[box-shadow,background-color,color] duration-100 ease-linear',
        styles[size].slot,
        isFocused &&
          slot?.isActive &&
          'outline outline-2 outline-offset-2 outline-[#315efb]/40 ring-2 ring-[#315efb]',
        slot?.char && 'text-neutral-900 ring-2 ring-[#315efb]',
        disabled && 'opacity-50',
        invalid && 'text-red-600 ring-red-300',
        className
      )}
    >
      {slot?.char ? slot.char : slot?.hasFakeCaret ? <FakeCaret size={size} /> : '0'}
    </div>
  );
};
Slot.displayName = 'Slot';

const FakeCaret = ({ size = 'md' }: { size?: PinInputSize }) => {
  return (
    <div
      className={cx(
        'pointer-events-none h-[1em] w-0.5 animate-caret-blink bg-[#315efb]',
        styles[size].caret
      )}
    />
  );
};

const Separator = (props: ComponentPropsWithRef<'div'>) => {
  return (
    <div
      role="separator"
      {...props}
      className={cx('px-0.5 text-center text-2xl font-medium text-neutral-300', props.className)}
    >
      -
    </div>
  );
};
Separator.displayName = 'Separator';

const Label = ({
  className,
  htmlFor,
  id: idProp,
  ...props
}: ComponentPropsWithRef<'label'>) => {
  const { id } = usePinInputContext();
  return (
    <label
      {...props}
      htmlFor={htmlFor || 'pin-input-' + id}
      id={idProp || 'pin-input-label-' + id}
      className={cx('text-sm font-medium text-neutral-700', className)}
    />
  );
};
Label.displayName = 'Label';

const Description = ({ className, id: idProp, ...props }: ComponentPropsWithRef<'p'>) => {
  const { id, size } = usePinInputContext();
  return (
    <p
      {...props}
      id={idProp || 'pin-input-description-' + id}
      role="note"
      className={cx('text-sm text-neutral-500', size === 'xxxs' && 'text-xs', className)}
    />
  );
};
Description.displayName = 'Description';

type PinInputComponent = typeof Root & {
  Slot: typeof Slot;
  Label: typeof Label;
  Group: typeof Group;
  Separator: typeof Separator;
  Description: typeof Description;
};

const PinInput = Root as PinInputComponent;
PinInput.Slot = Slot;
PinInput.Label = Label;
PinInput.Group = Group;
PinInput.Separator = Separator;
PinInput.Description = Description;

export { PinInput };
export type { PinInputSize };

/** Convenience 6-digit verification code field (email / 2FA). */
export const VerificationCodeInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  size?: PinInputSize;
  label?: ReactNode;
  description?: ReactNode;
  'aria-label'?: string;
  className?: string;
  maxLength?: number;
  withSeparator?: boolean;
}> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  invalid = false,
  size = 'sm',
  label,
  description,
  'aria-label': ariaLabel,
  className,
  maxLength = 6,
  withSeparator = true,
}) => {
  const slots = Array.from({ length: maxLength }, (_, index) => index);
  const mid = Math.floor(maxLength / 2);

  return (
    <PinInput size={size} disabled={disabled} invalid={invalid} className={className}>
      {label ? <PinInput.Label>{label}</PinInput.Label> : null}
      <PinInput.Group
        maxLength={maxLength}
        pattern={REGEXP_ONLY_DIGITS}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        aria-label={typeof ariaLabel === 'string' ? ariaLabel : undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        containerClassName="justify-center"
      >
        {slots.map((index) => (
          <React.Fragment key={index}>
            {withSeparator && index === mid ? <PinInput.Separator /> : null}
            <PinInput.Slot index={index} />
          </React.Fragment>
        ))}
      </PinInput.Group>
      {description ? <PinInput.Description>{description}</PinInput.Description> : null}
    </PinInput>
  );
};

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
} from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions } from 'qr-code-styling';
import { cx } from '../../utils/cx';

const QRCodeFrameHandle = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cx('size-3 rounded-tl border-t-2 border-l-2 border-[#315efb]', className)}
  />
);

/** Soft brand wash over the lower half of the QR (Untitled UI–style). */
export const GradientScan = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cx('absolute bottom-0 h-1/2 w-full border-t border-[#315efb] bg-[#315efb]/10', className)}
    style={{
      maskImage: 'radial-gradient(52.19% 100% at 50% 0%, #000 0%, rgba(0,0,0,0) 95.31%)',
      WebkitMaskImage: 'radial-gradient(52.19% 100% at 50% 0%, #000 0%, rgba(0,0,0,0) 95.31%)',
      ...props.style,
    }}
  />
);

const styles = {
  md: { root: 'p-2', qr: { width: 96, height: 96 } },
  lg: { root: 'p-3', qr: { width: 128, height: 128 } },
  xl: { root: 'p-4', qr: { width: 240, height: 240 } },
  '2xl': { root: 'p-5', qr: { width: 320, height: 320 } },
  '3xl': { root: 'p-4', qr: { width: 360, height: 360 } },
} as const;

export type QRCodeHandle = {
  /** Download QR as PNG (filename without extension). */
  downloadPng: (fileName: string) => Promise<void>;
  /** Raw PNG blob for Web Share / upload. */
  getPngBlob: () => Promise<Blob | null>;
};

interface QRCodeProps {
  value: string;
  options?: QRCodeStylingOptions;
  size?: keyof typeof styles;
  className?: string;
}

function buildOptions(
  sizeStyle: (typeof styles)[keyof typeof styles],
  value: string,
  options?: QRCodeStylingOptions
): QRCodeStylingOptions {
  return {
    width: sizeStyle.qr.width,
    height: sizeStyle.qr.height,
    data: value || ' ',
    type: 'canvas',
    dotsOptions: { color: '#171717', type: 'rounded' },
    cornersSquareOptions: { color: '#171717', type: 'extra-rounded' },
    cornersDotOptions: { color: '#315efb', type: 'dot' },
    backgroundOptions: { color: '#ffffff' },
    ...options,
  };
}

export const QRCode = forwardRef<QRCodeHandle, QRCodeProps>(function QRCode(
  { size = 'md', value, options, className },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<QRCodeStyling | null>(null);
  const sizeStyle = styles[size];

  useImperativeHandle(ref, () => ({
    downloadPng: async (fileName: string) => {
      const instance = instanceRef.current;
      if (!instance) return;
      await instance.download({ name: fileName.replace(/\.png$/i, ''), extension: 'png' });
    },
    getPngBlob: async () => {
      const instance = instanceRef.current;
      if (!instance) return null;
      const raw = await instance.getRawData('png');
      if (!raw) return null;
      if (raw instanceof Blob) return raw;
      return new Blob([raw as BlobPart], { type: 'image/png' });
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    if (!instanceRef.current) {
      containerRef.current.innerHTML = '';
      instanceRef.current = new QRCodeStyling(buildOptions(sizeStyle, value, options));
      instanceRef.current.append(containerRef.current);
      return;
    }

    instanceRef.current.update(buildOptions(sizeStyle, value, options));
  }, [value, size, sizeStyle, options]);

  useEffect(() => {
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, []);

  return (
    <div className={cx('relative flex items-center justify-center', sizeStyle.root, className)}>
      <div ref={containerRef} />
      <QRCodeFrameHandle className="absolute left-0 top-0" />
      <QRCodeFrameHandle className="absolute right-0 top-0 rotate-90" />
      <QRCodeFrameHandle className="absolute bottom-0 right-0 rotate-180" />
      <QRCodeFrameHandle className="absolute bottom-0 left-0 -rotate-90" />
    </div>
  );
});

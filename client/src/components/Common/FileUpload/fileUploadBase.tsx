import React, { useId, useRef, useState, type ComponentPropsWithRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  CloudUpload,
  File as FileIcon,
  FileImage,
  FileText,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';

/** Human-readable file size (Untitled UI–compatible helper). */
export function getReadableFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes === 0) return '0 KB';
  const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), suffixes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.floor(value)} ${suffixes[i]}`;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function fileTypeKind(name: string, mime?: string): 'image' | 'pdf' | 'doc' | 'empty' {
  const lower = name.toLowerCase();
  const mimeLower = (mime || '').toLowerCase();
  if (mimeLower.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(lower)) {
    return 'image';
  }
  if (mimeLower === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf';
  if (/\.(docx?|txt|md|rtf|csv)$/i.test(lower)) return 'doc';
  return 'empty';
}

function FileTypeGlyph({
  name,
  mime,
  className,
}: {
  name: string;
  mime?: string;
  className?: string;
}) {
  const kind = fileTypeKind(name, mime);
  const Icon = kind === 'image' ? FileImage : kind === 'pdf' || kind === 'doc' ? FileText : FileIcon;
  return (
    <span
      className={cx(
        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600',
        className
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

interface FileUploadDropZoneProps {
  className?: string;
  hint?: string;
  isDisabled?: boolean;
  accept?: string;
  allowsMultiple?: boolean;
  maxSize?: number;
  onDropFiles?: (files: FileList) => void;
  onDropUnacceptedFiles?: (files: FileList) => void;
  onSizeLimitExceed?: (files: FileList) => void;
}

export const FileUploadDropZone: React.FC<FileUploadDropZoneProps> = ({
  className,
  hint,
  isDisabled,
  accept,
  allowsMultiple = true,
  maxSize,
  onDropFiles,
  onDropUnacceptedFiles,
  onSizeLimitExceed,
}) => {
  const { t } = useTranslation();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isFileTypeAccepted = (file: File): boolean => {
    if (!accept) return true;
    const acceptedTypes = accept.split(',').map((type) => type.trim());
    return acceptedTypes.some((acceptedType) => {
      if (acceptedType.startsWith('.')) {
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        return extension === acceptedType.toLowerCase();
      }
      if (acceptedType.endsWith('/*')) {
        const typePrefix = acceptedType.split('/')[0];
        return file.type.startsWith(`${typePrefix}/`);
      }
      return file.type === acceptedType;
    });
  };

  const handleDragIn = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOut = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const processFiles = (files: File[]): void => {
    setIsInvalid(false);
    const acceptedFiles: File[] = [];
    const unacceptedFiles: File[] = [];
    const oversizedFiles: File[] = [];
    const filesToProcess = allowsMultiple ? files : files.slice(0, 1);

    filesToProcess.forEach((file) => {
      if (maxSize && file.size > maxSize) {
        oversizedFiles.push(file);
        return;
      }
      if (isFileTypeAccepted(file)) acceptedFiles.push(file);
      else unacceptedFiles.push(file);
    });

    if (oversizedFiles.length > 0 && typeof onSizeLimitExceed === 'function') {
      const dataTransfer = new DataTransfer();
      oversizedFiles.forEach((file) => dataTransfer.items.add(file));
      setIsInvalid(true);
      onSizeLimitExceed(dataTransfer.files);
    }

    if (acceptedFiles.length > 0 && typeof onDropFiles === 'function') {
      const dataTransfer = new DataTransfer();
      acceptedFiles.forEach((file) => dataTransfer.items.add(file));
      onDropFiles(dataTransfer.files);
    }

    if (unacceptedFiles.length > 0 && typeof onDropUnacceptedFiles === 'function') {
      const unacceptedDataTransfer = new DataTransfer();
      unacceptedFiles.forEach((file) => unacceptedDataTransfer.items.add(file));
      setIsInvalid(true);
      onDropUnacceptedFiles(unacceptedDataTransfer.files);
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    handleDragOut(event);
    processFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div
      data-dropzone
      onDragOver={handleDragIn}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragEnd={handleDragOut}
      onDrop={handleDrop}
      className={cx(
        'relative flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-5 text-neutral-500 ring-1 ring-neutral-200 transition duration-100 ease-linear ring-inset',
        isDraggingOver && 'ring-2 ring-[#315efb]',
        isDisabled && 'cursor-not-allowed bg-neutral-50 opacity-70',
        className
      )}
    >
      <span
        className={cx(
          'flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm',
          isDisabled && 'opacity-50'
        )}
      >
        <CloudUpload className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="flex flex-col gap-1 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1 text-center">
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="peer sr-only"
            disabled={isDisabled}
            accept={accept}
            multiple={allowsMultiple}
            onChange={(event) => processFiles(Array.from(event.target.files || []))}
          />
          <label
            htmlFor={id}
            className={cx(
              'cursor-pointer text-sm font-semibold text-[#315efb] hover:underline',
              isDisabled && 'cursor-not-allowed no-underline opacity-50'
            )}
          >
            {t('community.fileUpload.clickToUpload')}
            <span className="md:hidden">{t('community.fileUpload.andAttachFiles')}</span>
          </label>
          <span className="text-sm max-md:hidden">{t('community.fileUpload.orDragDrop')}</span>
        </div>
        <p
          className={cx(
            'text-xs transition duration-100 ease-linear',
            isInvalid ? 'text-red-600' : 'text-neutral-500'
          )}
        >
          {hint || t('community.fileUpload.hintDefault')}
        </p>
      </div>
    </div>
  );
};

export interface FileListItemProps {
  name: string;
  size: number;
  progress: number;
  failed?: boolean;
  type?: string;
  className?: string;
  onDelete?: () => void;
  onRetry?: () => void;
}

export const FileListItemProgressFill: React.FC<FileListItemProps> = ({
  name,
  size,
  progress,
  failed,
  type,
  onDelete,
  onRetry,
  className,
}) => {
  const { t } = useTranslation();
  const isComplete = progress === 100 && !failed;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cx('relative flex gap-3 overflow-hidden rounded-xl bg-white p-4', className)}
    >
      <div
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, progress))}%)` }}
        className={cx(
          'absolute inset-0 size-full bg-neutral-100 transition duration-75 ease-linear',
          isComplete && 'opacity-0'
        )}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      <div
        className={cx(
          'absolute inset-0 size-full rounded-[inherit] ring-1 ring-neutral-200 transition duration-100 ease-linear ring-inset',
          failed && 'ring-2 ring-red-500'
        )}
      />
      <FileTypeGlyph name={name} mime={type} className="relative" />
      <div className="relative flex min-w-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col items-start">
          <div className="w-full min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800">{name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-sm text-neutral-500">
                {failed
                  ? t('community.fileUpload.uploadFailedRetry')
                  : getReadableFileSize(size)}
              </p>
              {!failed && (
                <>
                  <hr className="h-3 w-px rounded-full border-none bg-neutral-200" />
                  <div className="flex items-center gap-1">
                    {isComplete ? (
                      <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={2.5} />
                    ) : (
                      <CloudUpload className="size-4 text-neutral-400" strokeWidth={2.5} />
                    )}
                    <p className="text-sm text-neutral-500">{progress}%</p>
                  </div>
                </>
              )}
              {failed && <XCircle className="size-4 text-red-600" aria-hidden />}
            </div>
          </div>
          {failed && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1.5 text-sm font-semibold text-red-600 hover:underline"
            >
              {t('community.fileUpload.tryAgain')}
            </button>
          ) : null}
        </div>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            title={t('community.fileUpload.delete')}
            aria-label={t('community.fileUpload.delete')}
            className="-mt-2 -mr-2 self-start rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </motion.li>
  );
};

export const FileListItemProgressBar: React.FC<FileListItemProps> = ({
  name,
  size,
  progress,
  failed,
  type,
  onDelete,
  onRetry,
  className,
}) => {
  const { t } = useTranslation();
  const isComplete = progress === 100 && !failed;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cx(
        'relative flex gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200 transition-shadow duration-100 ease-linear ring-inset',
        failed && 'ring-2 ring-red-500',
        className
      )}
    >
      <FileTypeGlyph name={name} mime={type} />
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full max-w-full min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800">{name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="truncate whitespace-nowrap text-sm text-neutral-500">
                {getReadableFileSize(size)}
              </p>
              <hr className="h-3 w-px rounded-full border-none bg-neutral-200" />
              <div className="flex items-center gap-1">
                {isComplete && (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={2.5} />
                    <p className="text-sm font-medium text-emerald-700">
                      {t('community.fileUpload.complete')}
                    </p>
                  </>
                )}
                {!isComplete && !failed && (
                  <>
                    <CloudUpload className="size-4 text-neutral-400" strokeWidth={2.5} />
                    <p className="text-sm font-medium text-neutral-500">
                      {t('community.fileUpload.uploading')}
                    </p>
                  </>
                )}
                {failed && (
                  <>
                    <XCircle className="size-4 text-red-600" />
                    <p className="text-sm font-medium text-red-600">
                      {t('community.fileUpload.failed')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              title={t('community.fileUpload.delete')}
              aria-label={t('community.fileUpload.delete')}
              className="-mt-2 -mr-2 self-start rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        {!failed && (
          <div className="mt-2 w-full">
            <div className="flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-[#315efb] transition-[width] duration-100 ease-linear"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-500">
                {progress}%
              </span>
            </div>
          </div>
        )}
        {failed && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 text-sm font-semibold text-red-600 hover:underline"
          >
            {t('community.fileUpload.tryAgain')}
          </button>
        ) : null}
      </div>
    </motion.li>
  );
};

const FileUploadRoot = (props: ComponentPropsWithRef<'div'>) => (
  <div {...props} className={cx('flex flex-col gap-4', props.className)}>
    {props.children}
  </div>
);

const FileUploadList = (props: ComponentPropsWithRef<'ul'>) => (
  <ul {...props} className={cx('flex flex-col gap-3', props.className)}>
    <AnimatePresence initial={false}>{props.children}</AnimatePresence>
  </ul>
);

export const FileUpload = {
  Root: FileUploadRoot,
  List: FileUploadList,
  DropZone: FileUploadDropZone,
  ListItemProgressBar: FileListItemProgressBar,
  ListItemProgressFill: FileListItemProgressFill,
};

export type UploadedFileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  failed?: boolean;
  fileObject?: File;
};

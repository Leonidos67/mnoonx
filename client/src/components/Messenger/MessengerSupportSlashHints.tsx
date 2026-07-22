import React, { useEffect, useRef } from 'react';
import type { SupportSlashCommand } from '../../constants/supportSlashCommands';

type MessengerSupportSlashHintsProps = {
  commands: SupportSlashCommand[];
  activeIndex: number;
  getDescription: (key: string) => string;
  onSelect: (command: string) => void;
  onHoverIndex: (index: number) => void;
};

/** Autocomplete list above the composer when typing / in Support chat. */
const MessengerSupportSlashHints: React.FC<MessengerSupportSlashHintsProps> = ({
  commands,
  activeIndex,
  getDescription,
  onSelect,
  onHoverIndex,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-slash-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!commands.length) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-56 overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg"
      role="listbox"
      aria-label={getDescription('messenger.supportCommands.hintsLabel')}
    >
      {commands.map((cmd, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={cmd.command}
            type="button"
            role="option"
            aria-selected={active}
            data-slash-index={index}
            onMouseEnter={() => onHoverIndex(index)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(cmd.command);
            }}
            className={`flex w-full items-start gap-3 px-3 py-2 text-left transition-colors ${
              active ? 'bg-[#eef2ff]' : 'hover:bg-neutral-50'
            }`}
          >
            <span className="shrink-0 font-mono text-sm font-semibold text-[#3730a3]">
              {cmd.command}
            </span>
            <span className="min-w-0 text-sm text-neutral-600">{getDescription(cmd.descriptionKey)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessengerSupportSlashHints;

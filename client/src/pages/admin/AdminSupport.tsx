import React, { useState } from 'react';
import { MessageCircle, RefreshCw, Ticket } from 'lucide-react';
import AdminSupportMessages from './AdminSupportMessages';
import AdminSupportTickets from './AdminSupportTickets';

type SupportMode = 'tickets' | 'messages';

const AdminSupport: React.FC = () => {
  const [mode, setMode] = useState<SupportMode>('tickets');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[480px] flex-col lg:h-[calc(100dvh-4rem)]">
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Поддержка</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Тикеты из документации и диалоги Mnoonx Support в мессенджере
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4" />
          Обновить
        </button>
      </div>

      <div className="mb-4 flex shrink-0 gap-2 rounded-xl border border-white/10 bg-[#141820] p-1">
        <button
          type="button"
          onClick={() => setMode('tickets')}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none ${
            mode === 'tickets'
              ? 'bg-violet-600 text-white'
              : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
          }`}
        >
          <Ticket className="h-4 w-4" />
          Тикеты
        </button>
        <button
          type="button"
          onClick={() => setMode('messages')}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none ${
            mode === 'messages'
              ? 'bg-violet-600 text-white'
              : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Сообщения
        </button>
      </div>

      <div key={`${mode}-${refreshKey}`} className="flex min-h-0 flex-1 flex-col">
        {mode === 'tickets' ? <AdminSupportTickets /> : <AdminSupportMessages />}
      </div>
    </div>
  );
};

export default AdminSupport;

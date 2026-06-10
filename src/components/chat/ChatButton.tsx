import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">Asistente CasaVidal</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-primary-500 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <ChatWidget />
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}

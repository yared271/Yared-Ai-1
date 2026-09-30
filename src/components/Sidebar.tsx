import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  Download, 
  Plus, 
  BookMarked,
  Search,
  Sparkles
} from 'lucide-react';
import { Thread, Language } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  threads: Thread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  onRenameThread: (threadId: string, newTitle: string) => void;
  onClearAllThreads: () => void;
  onExportCurrentChat: () => void;
  onOpenPromptLibrary: () => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
  onClearAllThreads,
  onExportCurrentChat,
  onOpenPromptLibrary,
  language,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isAmharic = language === 'am';

  const startRename = (thread: Thread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(thread.id);
    setEditTitle(thread.title);
  };

  const saveRename = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameThread(threadId, editTitle.trim());
    }
    setEditingId(null);
  };

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:w-80 bg-stone-900 border-r border-stone-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-stone-100">
              {isAmharic ? 'የውይይት ማህደር' : 'Chat Archive'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAmharic ? 'አዲስ ውይይት ጀምር' : 'Start New Chat'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenPromptLibrary();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium border border-stone-700/60 transition-colors cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAmharic ? 'የጥያቄዎች ማዕከል' : 'Prompt Library'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAmharic ? 'በውይይት ርዕስ ፈልግ...' : 'Search chat titles...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-10 px-4 text-stone-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
              <p>{isAmharic ? 'ምንም የተቀመጠ ውይይት የለም' : 'No chats found'}</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const isEditing = editingId === thread.id;

              return (
                <div
                  key={thread.id}
                  onClick={() => {
                    onSelectThread(thread.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(thread.id, e as any);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-0.5 rounded bg-stone-950 border border-amber-500 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{thread.title}</span>
                    )}
                  </div>

                  {/* Actions on hover or active */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={(e) => saveRename(thread.id, e)}
                        className="p-1 rounded text-emerald-400 hover:bg-stone-700"
                        title="አስቀምጥ / Save"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => startRename(thread, e)}
                          className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-700"
                          title="ስም ቀይር / Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(isAmharic ? 'ይህንን ውይይት መሰረዝ ይፈልጋሉ?' : 'Delete this chat?')) {
                              onDeleteThread(thread.id);
                            }
                          }}
                          className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-stone-700"
                          title="ሰርዝ / Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-800 space-y-1.5 bg-stone-950/40">
          <button
            type="button"
            onClick={onExportCurrentChat}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'ውይይቱን በፋይል አውርድ' : 'Export Chat (.md)'}</span>
          </button>

          {threads.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isAmharic ? 'ሁሉንም ውይይቶች መሰረዝ ይፈልጋሉ?' : 'Clear all chat history?')) {
                  onClearAllThreads();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg text-[11px] text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isAmharic ? 'ሁሉንም ማህደር አጽዳ' : 'Clear all history'}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

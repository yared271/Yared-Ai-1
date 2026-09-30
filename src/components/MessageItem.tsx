import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown,
  FileText,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Message, Language } from '../types';
import { renderMarkdown } from '../utils/markdown';

interface MessageItemProps {
  message: Message;
  language: Language;
  onSelectFollowup: (question: string) => void;
  onRegenerate?: () => void;
  isLastAssistant: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  language,
  onSelectFollowup,
  onRegenerate,
  isLastAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isAssistant = message.role === 'assistant';
  const isAmharic = language === 'am';

  // Format time
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle code block copy events inside rendered markdown
  useEffect(() => {
    const handleCodeCopy = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLElement;
      if (!target) return;
      const encodedCode = target.getAttribute('data-code');
      if (encodedCode) {
        const code = decodeURIComponent(encodedCode);
        navigator.clipboard.writeText(code).then(() => {
          const label = target.querySelector('.copy-label');
          if (label) {
            const original = label.textContent;
            label.textContent = isAmharic ? 'ተቀድቷል! / Copied' : 'Copied!';
            setTimeout(() => {
              label.textContent = original;
            }, 2000);
          }
        });
      }
    };

    document.addEventListener('click', handleCodeCopy);
    return () => document.removeEventListener('click', handleCodeCopy);
  }, [isAmharic]);

  // Clean full text copy
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Text-To-Speech (SpeechSynthesis)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    // Strip markdown formatting for cleaner audio
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'ኮድ ተዘሏል') // skip code blocks in audio
      .replace(/[#*_`>~\[\]\(\)]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Look for Amharic or English voice
    const voices = window.speechSynthesis.getVoices();
    const amharicVoice = voices.find((v) => v.lang.startsWith('am'));
    const englishVoice = voices.find((v) => v.lang.startsWith('en'));

    if (amharicVoice && /[\u1200-\u137F]/.test(cleanText)) {
      utterance.voice = amharicVoice;
      utterance.lang = 'am-ET';
    } else if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = 'en-US';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`py-4 px-3 md:px-6 transition-colors ${isAssistant ? 'bg-stone-900/40 border-y border-stone-850' : ''}`}>
      <div className="max-w-4xl mx-auto flex gap-3 md:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isAssistant ? (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md shadow-amber-500/20 text-stone-950">
              <span className="font-extrabold text-sm font-mono text-white">ያ</span>
              {message.isStreaming && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-900 animate-ping"></span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-stone-800 border border-stone-700 text-stone-300">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Row: Name & Timestamp */}
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold text-stone-200">
              {isAssistant ? (isAmharic ? 'ያሬድ AI' : 'Yared AI') : (isAmharic ? 'እርስዎ' : 'You')}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
              <Clock className="w-3 h-3" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* User Attachments (if any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-stone-700/80 bg-stone-800/80 max-w-xs">
                  {att.mimeType.startsWith('image/') ? (
                    <img
                      src={att.data}
                      alt={att.name || 'Uploaded image'}
                      className="max-h-56 w-auto object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 text-xs text-stone-200">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Render Content */}
          <div className="text-stone-100 text-[14.5px] leading-relaxed break-words">
            {isAssistant ? (
              <div
                className="prose prose-invert prose-stone max-w-none prose-headings:text-amber-300 prose-headings:font-bold prose-headings:border-b prose-headings:border-stone-800/70 prose-headings:pb-1.5 prose-a:text-amber-400 prose-strong:text-amber-100 prose-code:text-amber-300"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}

            {/* Pulsing cursor while streaming */}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle rounded-sm"></span>
            )}
          </div>

          {/* Assistant Action Bar */}
          {isAssistant && !message.isStreaming && message.content && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-800/60 mt-3">
              <div className="flex items-center gap-1">
                {/* Read Aloud button */}
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={isPlayingAudio ? (isAmharic ? 'ድምጽ አቁም' : 'Stop Audio') : (isAmharic ? 'በድምጽ አዳምጥ' : 'Read Aloud')}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? (isAmharic ? 'አቁም' : 'Stop') : (isAmharic ? 'አዳምጥ' : 'Listen')}</span>
                </button>

                {/* Copy message button */}
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                  title={isAmharic ? 'ሙሉውን መልስ ቅዳ' : 'Copy message'}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isAmharic ? 'ተቀድቷል' : 'Copied') : (isAmharic ? 'ቅዳ' : 'Copy')}</span>
                </button>

                {/* Regenerate if last */}
                {isLastAssistant && onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                    title={isAmharic ? 'መልሱን እንደገና አመንጭ' : 'Regenerate answer'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'እንደገና' : 'Regenerate'}</span>
                  </button>
                )}
              </div>

              {/* Feedback buttons */}
              <div className="flex items-center gap-1 text-stone-500">
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    feedback === 'up' ? 'text-emerald-400 bg-stone-800' : 'hover:text-stone-300 hover:bg-stone-800'
                  }`}
                  title={isAmharic ? 'ጠቃሚ ነው' : 'Helpful'}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    feedback === 'down' ? 'text-rose-400 bg-stone-800' : 'hover:text-stone-300 hover:bg-stone-800'
                  }`}
                  title={isAmharic ? 'ጠቃሚ አይደለም' : 'Not helpful'}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Follow-up suggestions */}
          {isAssistant && message.followups && message.followups.length > 0 && !message.isStreaming && (
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/90">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ተያያዥ ጥያቄዎች (Follow-up Questions)' : 'Suggested Follow-up Questions:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.followups.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectFollowup(question)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-stone-800/90 hover:bg-amber-500/20 text-stone-200 hover:text-amber-200 border border-stone-700/70 hover:border-amber-500/40 transition-all cursor-pointer text-left shadow-sm"
                  >
                    <span>{question}</span>
                    <span className="text-amber-400">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

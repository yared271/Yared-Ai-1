import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { 
  ArrowUp, 
  Square, 
  Paperclip, 
  Mic, 
  MicOff, 
  X, 
  FileText, 
  Sparkles,
  ChevronDown,
  Loader2,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { Attachment, Language, ResponseStyle } from '../types';
import { STYLE_OPTIONS } from '../data/promptLibrary';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  language: Language;
  selectedStyle: ResponseStyle;
  onStyleChange: (style: ResponseStyle) => void;
  initialValue?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  language,
  selectedStyle,
  onStyleChange,
  initialValue = '',
}) => {
  const [text, setText] = useState(initialValue);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // Audio recording refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isAmharic = language === 'am';

  // Synchronize initial value if set from outside
  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Cleanup media recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Transcribe recorded audio via AI backend (/api/transcribe-audio)
  const transcribeAudioBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    setMicError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: blob.type || 'audio/webm',
              language,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim()) {
              setText((prev) => (prev ? `${prev} ${data.text.trim()}` : data.text.trim()));
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            } else {
              setMicError(
                isAmharic
                  ? 'ምንም ግልጽ ድምጽ አልተሰማም። እባክዎ እንደገና ይሞክሩ።'
                  : 'No clear speech detected. Please speak closer to the microphone and try again.'
              );
            }
          } else {
            throw new Error(`Server returned HTTP ${res.status}`);
          }
        } catch (err: any) {
          console.error('Server transcription error:', err);
          setMicError(
            isAmharic
              ? 'ድምጹን ወደ ጽሑፍ መቀየር አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
              : 'Failed to transcribe audio. Please try again.'
          );
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to read audio blob:', err);
      setIsTranscribing(false);
    }
  };

  // Start Voice Recording via MediaRecorder
  const startRecording = async () => {
    setMicError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(
        isAmharic
          ? 'ይህ አሳሽ ድምጽ መቅዳትን አይደግፍም።'
          : 'Your browser does not support audio recording.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop audio tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 100) {
          transcribeAudioBlob(audioBlob);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      setMicError(
        isAmharic
          ? 'ማይክሮፎኑ አልተገኘም ወይም ፈቃድ አልተሰጠም። እባክዎ በአሳሽዎ ቅንብሮች ውስጥ የማይክሮፎን ፈቃድ ይስጡ።'
          : 'Microphone access was denied or is unavailable. Please check your browser microphone permissions.'
      );
    }
  };

  // Stop Recording and convert
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }
  };

  // Cancel Recording without transcribing
  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Clear chunks before stopping to avoid transcribing
      audioChunksRef.current = [];
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Process & compress large images to ensure instant upload and crisp vision
  const processImageFile = (file: File): Promise<Attachment> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL('image/jpeg', 0.88);
            resolve({
              name: file.name.replace(/\.[^.]+$/, '.jpg'),
              mimeType: 'image/jpeg',
              data: compressedData,
              size: Math.round(compressedData.length * 0.75),
            });
            return;
          }

          // Fallback to raw base64
          resolve({
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            data: e.target?.result as string,
            size: file.size,
          });
        };
        img.onerror = () => {
          resolve({
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            data: e.target?.result as string,
            size: file.size,
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file attachments (images, text, documents)
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > 30 * 1024 * 1024) {
        setMicError(isAmharic ? 'የፋይሉ መጠን ከ 30MB መብለጥ የለበትም።' : 'File size should not exceed 30MB.');
        continue;
      }

      if (file.type.startsWith('image/')) {
        const att = await processImageFile(file);
        setAttachments((prev) => [...prev, att]);
      } else {
        // Read text or code file
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const base64Data = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: 'text/plain',
              data: base64Data,
              size: file.size,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Support pasting images or text directly into the chat input
  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const att = await processImageFile(file);
          setAttachments((prev) => [...prev, att]);
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    if (isRecording) {
      stopRecording();
    }

    onSendMessage(trimmed, attachments);
    setText('');
    setAttachments([]);
    setMicError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentStyleObj = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];

  return (
    <div className="sticky bottom-0 z-20 px-3 md:px-6 pb-3 pt-2 bg-gradient-to-t from-stone-950 via-stone-950/95 to-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Inline Error Notice */}
        {micError && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 mb-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{micError}</span>
            </div>
            <button
              type="button"
              onClick={() => setMicError(null)}
              className="p-1 text-amber-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachments preview tray */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-stone-900 border border-stone-800">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="relative group flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-200"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.data}
                    alt={att.name}
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-amber-400" />
                )}
                <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="p-0.5 rounded-full hover:bg-stone-700 text-stone-400 hover:text-white cursor-pointer"
                  aria-label="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live Audio Recording active banner */}
        {isRecording && (
          <div className="flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-rose-200">
                <Volume2 className="w-4 h-4 animate-bounce text-rose-400" />
                <span>{isAmharic ? 'ድምጽ እየተቀዳ ነው... በግልጽ ይናገሩ' : 'Recording audio... Speak clearly'}</span>
              </div>
              <span className="font-mono text-xs text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50">
                {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded-md cursor-pointer transition-colors"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="text-xs bg-rose-500 hover:bg-rose-400 text-stone-950 font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {isAmharic ? 'ጨርስና ለውጥ' : 'Finish & Transcribe'}
              </button>
            </div>
          </div>
        )}

        {/* Transcribing indicator */}
        {isTranscribing && (
          <div className="flex items-center gap-2 px-3.5 py-2 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span className="font-medium">
              {isAmharic
                ? 'የተቀዳውን ድምጽ በጥበብ AI ወደ ጽሑፍ በመተርጎም ላይ...'
                : 'Transcribing speech into text with Tibeb AI...'}
            </span>
          </div>
        )}

        {/* Main Input Box */}
        <div className="relative rounded-2xl bg-stone-900/95 border border-stone-800 shadow-xl focus-within:border-amber-500/70 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachments.length > 0
                ? (isAmharic ? 'በዚህ ፎቶ ላይ ምን ይጠየቅ? (ወይም ዝም ብለው «ላክ» የሚለውን ይጫኑ)' : 'Ask a question about this photo or press Send...')
                : (isAmharic ? 'በጤና፣ ስፖርት፣ ቴክኖሎጂ፣ ታሪክ፣ ፎቶ ወይም በማንኛውም ርዕስ ዙሪያ ይጠይቁ...' : 'Ask about health, coding, sports, history, analyze photos, or any topic...')
            }
            rows={1}
            className="w-full px-4 pt-3.5 pb-12 rounded-2xl bg-transparent text-sm text-stone-100 placeholder-stone-500 focus:outline-none resize-none leading-relaxed min-h-[52px]"
          />

          {/* Bottom Toolbar inside input */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            {/* Left buttons: Attachment, Mic, Style selector */}
            <div className="flex items-center gap-1">
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt,.py,.js,.jsx,.ts,.tsx,.json,.md,.html,.css,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors cursor-pointer"
                title={isAmharic ? 'ፎቶ ወይም ፋይል አያይዝ' : 'Attach photo or code file'}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Speech-to-text mic button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRecording
                    ? 'text-rose-400 bg-rose-500/20 ring-2 ring-rose-500/40 animate-pulse'
                    : isTranscribing
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-stone-400 hover:text-amber-400 hover:bg-stone-800'
                }`}
                title={
                  isRecording
                    ? (isAmharic ? 'ቀረጻ አቁም' : 'Stop voice recording')
                    : (isAmharic ? 'በድምጽ ተናገር (Voice Input)' : 'Voice Input (Speech-to-text)')
                }
              >
                {isRecording ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Style selector badge in input */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700/60 cursor-pointer"
                  title={isAmharic ? 'የመልስ ዘይቤ' : 'Response Style'}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="hidden xs:inline">
                    {isAmharic ? currentStyleObj.labelAm : currentStyleObj.labelEn}
                  </span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {isStyleMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-48 rounded-xl bg-stone-900 border border-stone-800 shadow-xl p-1 z-30 space-y-0.5">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          onStyleChange(style.id);
                          setIsStyleMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          style.id === selectedStyle
                            ? 'bg-amber-500/20 text-amber-300 font-semibold'
                            : 'text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <span>{isAmharic ? style.labelAm : style.labelEn}</span>
                        {style.id === selectedStyle && <span className="text-amber-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right button: Send or Stop */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-stone-500 font-sans">
                {isAmharic ? 'Shift+Enter አዲስ መስመር' : 'Shift+Enter for newline'}
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500 hover:bg-rose-400 text-stone-950 font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                  title={isAmharic ? 'አቁም' : 'Stop generating'}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() && attachments.length === 0}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-stone-950 font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title={isAmharic ? 'ላክ' : 'Send message'}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

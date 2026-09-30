import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WelcomeView } from './components/WelcomeView';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { Thread, Message, Language, ResponseStyle, Attachment } from './types';

const STORAGE_THREADS_KEY = 'tibeb_ai_threads_v1';
const STORAGE_LANG_KEY = 'tibeb_ai_language';
const STORAGE_STYLE_KEY = 'tibeb_ai_style';

export default function App() {
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THREADS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load threads from localStorage', e);
    }
    const initialThread: Thread = {
      id: crypto.randomUUID(),
      title: 'አዲስ ውይይት',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      style: 'balanced',
    };
    return [initialThread];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    return threads[0]?.id || '';
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_LANG_KEY) as Language) || 'am';
  });

  const [selectedStyle, setSelectedStyle] = useState<ResponseStyle>(() => {
    return (localStorage.getItem(STORAGE_STYLE_KEY) as ResponseStyle) || 'balanced';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingPromptInput, setPendingPromptInput] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

  // Persist threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
    } catch (e) {
      console.error('Failed to save threads to localStorage', e);
    }
  }, [threads]);

  // Persist language
  useEffect(() => {
    localStorage.setItem(STORAGE_LANG_KEY, language);
  }, [language]);

  // Persist style
  useEffect(() => {
    localStorage.setItem(STORAGE_STYLE_KEY, selectedStyle);
  }, [selectedStyle]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isStreaming]);

  // Create new chat
  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }

    const newThread: Thread = {
      id: crypto.randomUUID(),
      title: language === 'am' ? 'አዲስ ውይይት' : 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      style: selectedStyle,
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  // Delete chat
  const handleDeleteThread = (threadId: string) => {
    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== threadId);
      if (remaining.length === 0) {
        const fresh: Thread = {
          id: crypto.randomUUID(),
          title: language === 'am' ? 'አዲስ ውይይት' : 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          style: selectedStyle,
        };
        setActiveThreadId(fresh.id);
        return [fresh];
      }
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Rename chat
  const handleRenameThread = (threadId: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, title: newTitle, updatedAt: Date.now() } : t))
    );
  };

  // Clear all chats
  const handleClearAllThreads = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    const fresh: Thread = {
      id: crypto.randomUUID(),
      title: language === 'am' ? 'አዲስ ውይይት' : 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      style: selectedStyle,
    };
    setThreads([fresh]);
    setActiveThreadId(fresh.id);
  };

  // Export current chat as a formatted document (.md and formatted text)
  const handleExportCurrentChat = () => {
    if (!activeThread || activeThread.messages.length === 0) {
      return;
    }

    const isAm = language === 'am';
    const dateFormatted = new Date(activeThread.createdAt).toLocaleDateString(isAm ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let doc = `# ${activeThread.title}\n\n`;
    doc += `**${isAm ? 'የሰነድ ምንጭ' : 'Source'}**: ያሬድ AI (Yared AI) - ሁሉን አቀፍ የዕውቀት እና የቴክኖሎጂ ረዳት\n`;
    doc += `**${isAm ? 'የተዘጋጀበት ቀን' : 'Date'}**: ${dateFormatted}\n`;
    doc += `**${isAm ? 'የመልስ ዘይቤ' : 'Style Mode'}**: ${activeThread.style}\n\n`;
    doc += `---\n\n`;

    activeThread.messages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const speaker = isUser
        ? (isAm ? '👤 ጥያቄ አቅራቢ' : '👤 User Query')
        : (isAm ? '✨ ያሬድ AI ምላሽ' : '✨ Yared AI Response');
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      doc += `### ${idx + 1}. ${speaker} (${time})\n\n`;

      if (msg.attachments && msg.attachments.length > 0) {
        doc += `*${isAm ? 'የተያያዙ ፋይሎች' : 'Attached Files'}*: ${msg.attachments.map((a) => a.name).join(', ')}\n\n`;
      }

      doc += `${msg.content}\n\n`;
      doc += `---\n\n`;
    });

    doc += `\n*${isAm ? 'በያሬድ AI (Yared AI) በከፍተኛ ጥራት፣ ትክክለኛነትና ሚዛናዊነት የተዘጋጀ ሰነድ።' : 'Generated with Yared AI Universal Knowledge Assistant.'}*\n`;

    // Add UTF-8 BOM (\uFEFF) for flawless Amharic Ethiopic rendering in all document editors
    const blob = new Blob(['\uFEFF' + doc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFilename = activeThread.title.trim().replace(/[^a-zA-Z0-9\u1200-\u137F]/g, '_') || 'Yared_AI_Document';
    link.download = `${cleanFilename}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Stop generation
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // mark the last assistant message as finished
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t;
        const lastMsg = t.messages[t.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return {
            ...t,
            messages: [
              ...t.messages.slice(0, -1),
              { ...lastMsg, isStreaming: false },
            ],
          };
        }
        return t;
      })
    );
  };

  // Fetch follow-up questions
  const fetchFollowups = async (userQuery: string, assistantResponse: string) => {
    try {
      const res = await fetch('/api/suggest-followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery,
          assistantResponse,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.followups && Array.isArray(data.followups)) {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id !== activeThreadId) return t;
              const last = t.messages[t.messages.length - 1];
              if (last && last.role === 'assistant') {
                return {
                  ...t,
                  messages: [
                    ...t.messages.slice(0, -1),
                    { ...last, followups: data.followups },
                  ],
                };
              }
              return t;
            })
          );
        }
      }
    } catch (e) {
      console.error('Follow-up generation error:', e);
    }
  };

  // Send message
  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (isStreaming) return;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const timestamp = Date.now();

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp,
      attachments,
      style: selectedStyle,
    };

    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: timestamp + 1,
      style: selectedStyle,
      isStreaming: true,
    };

    // Update conversation state with user message & placeholder assistant message
    const updatedMessages = [...messages, userMessage];

    // Compute automatic title for thread if it's the first message
    const isFirstTurn = messages.length === 0;
    const computedTitle = isFirstTurn
      ? text.slice(0, 32).trim() || (language === 'am' ? 'አዲስ ውይይት' : 'New Chat')
      : activeThread.title;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: computedTitle,
              updatedAt: Date.now(),
              messages: [...updatedMessages, initialAssistantMessage],
            }
          : t
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare message history for server
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          style: selectedStyle,
          language,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable stream available in response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || ''; // Keep partial line for next iteration

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;

          const dataPayload = trimmedLine.replace(/^data:\s*/, '');
          if (dataPayload === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setThreads((prev) =>
                prev.map((t) => {
                  if (t.id !== activeThreadId) return t;
                  return {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedText, isStreaming: true }
                        : m
                    ),
                  };
                })
              );
            } else if (parsed.error) {
              accumulatedText += `\n\n⚠️ ${parsed.error}`;
            }
          } catch {
            // Non-JSON or incomplete chunk
          }
        }
      }

      // Finish streaming
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== activeThreadId) return t;
          return {
            ...t,
            messages: t.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: accumulatedText, isStreaming: false }
                : m
            ),
          };
        })
      );

      setIsStreaming(false);

      // Trigger automatic follow-up question suggestions
      if (accumulatedText) {
        fetchFollowups(text, accumulatedText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User stopped streaming.');
      } else {
        console.error('Error generating response:', err);
        const errMsg =
          language === 'am'
            ? 'መልስ ለማመንጨት አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
            : 'Failed to generate response. Please try again.';

        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== activeThreadId) return t;
            return {
              ...t,
              messages: t.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: `⚠️ ${errMsg}`, isStreaming: false }
                  : m
              ),
            };
          })
        );
      }
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (isStreaming || messages.length === 0) return;

    // Find the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userMessage = messages[lastUserIndex];
    // Trim conversation up to the last user message
    const trimmed = messages.slice(0, lastUserIndex);

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, messages: trimmed }
          : t
      )
    );

    // Re-send user prompt
    setTimeout(() => {
      handleSendMessage(userMessage.content, userMessage.attachments || []);
    }, 50);
  };

  // Choose prompt from Welcome screen or Prompt Library
  const handleSelectPrompt = (promptText: string, recommendedStyle?: ResponseStyle) => {
    if (recommendedStyle) {
      setSelectedStyle(recommendedStyle);
    }
    handleSendMessage(promptText, []);
  };

  return (
    <div className="flex h-screen bg-stone-950 text-stone-100 font-sans overflow-hidden">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => setActiveThreadId(id)}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
        onClearAllThreads={handleClearAllThreads}
        onExportCurrentChat={handleExportCurrentChat}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
        language={language}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header */}
        <Header
          language={language}
          onLanguageChange={setLanguage}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
          onExportCurrentChat={handleExportCurrentChat}
          isStreaming={isStreaming}
        />

        {/* Messages or Welcome View */}
        <main className="flex-1 overflow-y-auto min-h-0 relative">
          {messages.length === 0 ? (
            <WelcomeView
              language={language}
              onSelectPrompt={handleSelectPrompt}
              onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
            />
          ) : (
            <div className="pb-6">
              {messages.map((msg, index) => {
                const isLastAssistant =
                  msg.role === 'assistant' && index === messages.length - 1;

                return (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    language={language}
                    onSelectFollowup={(question) => handleSendMessage(question, [])}
                    onRegenerate={handleRegenerate}
                    isLastAssistant={isLastAssistant}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          language={language}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          initialValue={pendingPromptInput}
        />
      </div>

      {/* Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={handleSelectPrompt}
        language={language}
      />
    </div>
  );
}

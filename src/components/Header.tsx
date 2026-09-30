import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Menu, 
  Languages, 
  ChevronDown, 
  BookMarked,
  Scale,
  BookOpen,
  ListOrdered,
  Zap,
  Code2,
  Check,
  Download
} from 'lucide-react';
import { Language, ResponseStyle } from '../types';
import { STYLE_OPTIONS } from '../data/promptLibrary';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  selectedStyle: ResponseStyle;
  onStyleChange: (style: ResponseStyle) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenPromptLibrary: () => void;
  onExportCurrentChat: () => void;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  selectedStyle,
  onStyleChange,
  onNewChat,
  onToggleSidebar,
  onOpenPromptLibrary,
  onExportCurrentChat,
  isStreaming,
}) => {
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAmharic = language === 'am';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="w-4 h-4 text-amber-400" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'ListOrdered': return <ListOrdered className="w-4 h-4 text-blue-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-amber-300" />;
      case 'Code2': return <Code2 className="w-4 h-4 text-purple-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  const currentStyleObj = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-6 py-2.5 bg-stone-950/80 backdrop-blur-md border-b border-stone-800/80 text-stone-100">
      {/* Left section: Hamburger & Brand */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-850 transition-colors cursor-pointer border border-transparent"
          title={isAmharic ? 'የውይይት ታሪክ' : 'Chat History'}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo and Identity */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-md shadow-amber-500/20 text-stone-950 font-black">
            <span className="text-lg font-bold tracking-tight text-white font-mono">ያ</span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-950"></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-stone-100 font-sans">
                {isAmharic ? 'ያሬድ AI' : 'Yared AI'}
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Gemini Multimodal
              </span>
            </div>
            <span className="text-[11px] text-stone-400 hidden xs:inline truncate max-w-[200px]">
              {isAmharic ? 'ሁሉን አቀፍ የዕውቀት ረዳት' : 'Universal Knowledge Assistant'}
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right controls */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        {/* Style Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 hover:border-stone-700 hover:bg-stone-850 transition-all cursor-pointer shadow-sm"
            title={isAmharic ? 'የመልስ አሰጣጥ ዘይቤ ይምረጡ' : 'Choose Response Style'}
          >
            {getStyleIcon(currentStyleObj.icon)}
            <span className="font-medium hidden sm:inline">
              {isAmharic ? currentStyleObj.labelAm : currentStyleObj.labelEn}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
          </button>

          {isStyleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-stone-800/80 mb-1">
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  {isAmharic ? 'የመልስ አሰጣጥ ዘይቤ' : 'Response Style Persona'}
                </p>
                <p className="text-[10px] text-stone-400">
                  {isAmharic ? 'የጥበብ AI መልስ አደረጃጀት ምርጫ' : 'Adjust depth and technical focus'}
                </p>
              </div>

              <div className="space-y-1">
                {STYLE_OPTIONS.map((style) => {
                  const isSelected = style.id === selectedStyle;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        onStyleChange(style.id);
                        setIsStyleDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200'
                          : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100'
                      }`}
                    >
                      <div className="mt-0.5 p-1 rounded-lg bg-stone-950/60">
                        {getStyleIcon(style.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">
                            {isAmharic ? style.labelAm : style.labelEn}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">
                          {isAmharic ? style.descAm : style.descEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Prompt Library Button */}
        <button
          type="button"
          onClick={onOpenPromptLibrary}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-stone-100 hover:border-stone-700 transition-colors cursor-pointer"
          title={isAmharic ? 'የጥያቄዎች ማዕከል' : 'Prompt Library'}
        >
          <BookMarked className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline font-medium">
            {isAmharic ? 'የጥያቄዎች ማዕከል' : 'Prompt Library'}
          </span>
        </button>

        {/* Export Markdown button directly in header */}
        <button
          type="button"
          onClick={onExportCurrentChat}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-medium text-stone-300 hover:text-stone-100 hover:border-stone-700 transition-colors cursor-pointer"
          title={isAmharic ? 'ይህንን ውይይት እንደ ዶክመንት አውርድ' : 'Export document'}
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">{isAmharic ? 'ዶክመንት' : 'Export'}</span>
        </button>

        {/* Language switch button */}
        <button
          type="button"
          onClick={() => onLanguageChange(isAmharic ? 'en' : 'am')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-medium text-stone-200 hover:border-stone-700 transition-colors cursor-pointer"
          title={isAmharic ? 'ወደ እንግሊዝኛ ቀይር' : 'Switch to Amharic'}
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAmharic ? 'EN' : 'አማ'}</span>
        </button>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title={isAmharic ? 'አዲስ ውይይት ጀምር' : 'Start New Chat'}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline font-bold">
            {isAmharic ? 'አዲስ ውይይት' : 'New Chat'}
          </span>
        </button>
      </div>
    </header>
  );
};

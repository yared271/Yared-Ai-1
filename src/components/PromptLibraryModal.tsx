import React, { useState } from 'react';
import { 
  X, 
  Search, 
  BookMarked, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles,
  HeartPulse,
  Code2,
  Landmark,
  Trophy,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { DomainCategory, Language, PromptItem, ResponseStyle } from '../types';
import { CATEGORIES, CURATED_PROMPTS, STYLE_OPTIONS } from '../data/promptLibrary';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string, style?: ResponseStyle) => void;
  language: Language;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  language,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DomainCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAmharic = language === 'am';

  if (!isOpen) return null;

  const filteredPrompts = CURATED_PROMPTS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      item.titleAm.toLowerCase().includes(searchLower) ||
      item.titleEn.toLowerCase().includes(searchLower) ||
      item.promptAm.toLowerCase().includes(searchLower) ||
      item.promptEn.toLowerCase().includes(searchLower) ||
      item.tags.some((t) => t.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'HeartPulse': return <HeartPulse className="w-3.5 h-3.5" />;
      case 'Code2': return <Code2 className="w-3.5 h-3.5" />;
      case 'Landmark': return <Landmark className="w-3.5 h-3.5" />;
      case 'Trophy': return <Trophy className="w-3.5 h-3.5" />;
      case 'GraduationCap': return <GraduationCap className="w-3.5 h-3.5" />;
      case 'Briefcase': return <Briefcase className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-100 font-sans">
                {isAmharic ? 'የጥያቄዎች ማዕከል (Prompt Library)' : 'Prompt Library'}
              </h2>
              <p className="text-xs text-stone-400">
                {isAmharic ? 'በየርዕሱ የተዘጋጁ ከፍተኛ ጥራት ያላቸው ጥያቄዎች' : 'Curated high-signal prompts across key domains'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-4 border-b border-stone-800/80 space-y-3 bg-stone-900">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAmharic ? 'በርዕስ፣ በይዘት ወይም በቁልፍ ቃላት ፈልግ...' : 'Search by topic, keyword, or tag...'}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                      : 'bg-stone-950/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
                  }`}
                >
                  <span>{getCategoryIcon(cat.icon)}</span>
                  <span>{isAmharic ? cat.nameAm : cat.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompts list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredPrompts.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              <p>{isAmharic ? 'የሚስማማ ጥያቄ አልተገኘም' : 'No matching prompts found.'}</p>
            </div>
          ) : (
            filteredPrompts.map((item) => {
              const styleObj = STYLE_OPTIONS.find((s) => s.id === item.recommendedStyle);
              const promptText = isAmharic ? item.promptAm : item.promptEn;
              const titleText = isAmharic ? item.titleAm : item.titleEn;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 hover:border-amber-500/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-amber-300 border border-stone-700/60">
                        {isAmharic ? styleObj?.labelAm : styleObj?.labelEn}
                      </span>
                      <h3 className="font-semibold text-sm text-stone-100">
                        {titleText}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, promptText)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                        title={isAmharic ? 'ጽሑፉን ቅዳ' : 'Copy prompt text'}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectPrompt(promptText, item.recommendedStyle);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all cursor-pointer"
                      >
                        <span>{isAmharic ? 'ጠይቅ' : 'Ask'}</span>
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    {promptText}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] text-stone-400 bg-stone-900 border border-stone-800/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowUpRight, 
  BookMarked,
  HeartPulse,
  Code2,
  Landmark,
  Trophy,
  GraduationCap,
  Briefcase,
  Mic,
  Camera,
  Layers,
  Compass,
  Zap,
  Cpu,
  BrainCircuit
} from 'lucide-react';
import { DomainCategory, Language, ResponseStyle } from '../types';
import { CATEGORIES, CURATED_PROMPTS, STYLE_OPTIONS } from '../data/promptLibrary';

interface WelcomeViewProps {
  language: Language;
  onSelectPrompt: (promptText: string, recommendedStyle?: ResponseStyle) => void;
  onOpenPromptLibrary: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  language,
  onSelectPrompt,
  onOpenPromptLibrary,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DomainCategory>('all');
  const isAmharic = language === 'am';

  const filteredPrompts = selectedCategory === 'all'
    ? CURATED_PROMPTS
    : CURATED_PROMPTS.filter((p) => p.category === selectedCategory);

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
      case 'Code2': return <Code2 className="w-4 h-4" />;
      case 'Landmark': return <Landmark className="w-4 h-4" />;
      case 'Trophy': return <Trophy className="w-4 h-4" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // Gemini-style quick starter action cards
  const geminiStarters = [
    {
      titleAm: 'ኮዲንግ እና ቴክኖሎጂ',
      titleEn: 'Code & Architecture',
      descAm: 'ሙሉ የPython፣ React ወይም FastAPI ፕሮጀክት መዋቅር እና ኮድ አዘጋጅልኝ።',
      descEn: 'Design a clean TypeScript/React full-stack architecture with best practices.',
      icon: Code2,
      style: 'code_focus' as ResponseStyle,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300',
      iconBg: 'bg-blue-500/20 text-blue-400',
    },
    {
      titleAm: 'ጤና፣ ስነ-ምግብ እና የአኗኗር ዘይቤ',
      titleEn: 'Health & Nutrition',
      descAm: 'የጤፍ እና የባህላዊ እህሎች የጤና ጥቅሞች እና የተመጣጠነ ምግብ እቅድ አብራራልኝ።',
      descEn: 'Scientific breakdown of teff nutritional profile and healthy meal planning.',
      icon: HeartPulse,
      style: 'deep_dive' as ResponseStyle,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      titleAm: 'የኢትዮጵያ ታሪክ እና ቅርስ',
      titleEn: 'Ethiopian History & Heritage',
      descAm: 'የአድዋ ድል ታሪክ እና የጥንታዊ አክሱም ስልጣኔ ያስመዘገባቸውን ዋና ዋና ቅርሶች ዘርዝር።',
      descEn: 'Comprehensive deep dive into the Battle of Adwa and the Aksumite civilization.',
      icon: Landmark,
      style: 'deep_dive' as ResponseStyle,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    {
      titleAm: 'ስፖርት እና አትሌቲክስ',
      titleEn: 'Athletics & Marathon',
      descAm: 'የኢትዮጵያ አትሌቶች የሩጫ ስልጠና ዘዴ እና የ10 ኪ.ሜ የልምምድ ፕሮግራም አዘጋጅልኝ።',
      descEn: 'High-altitude marathon training regimen modeled after legendary Ethiopian distance runners.',
      icon: Trophy,
      style: 'step_by_step' as ResponseStyle,
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-300',
      iconBg: 'bg-rose-500/20 text-rose-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 space-y-10 animate-in fade-in duration-300">
      {/* Gemini-Style Main Hero Section */}
      <div className="space-y-4 pt-2 md:pt-4">
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 text-xs font-medium shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-semibold text-amber-400">{isAmharic ? 'ያሬድ AI' : 'Yared AI'}</span>
          <span className="text-stone-500">•</span>
          <span>{isAmharic ? 'ሁሉን አቀፍ ብልህ ረዳት' : 'Universal Knowledge Assistant'}</span>
        </div>

        {/* Gemini-Inspired Gradient Greeting */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-sans">
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              {isAmharic ? 'ሰላም፣ ዛሬ ምን እንመርምር?' : 'Hello, what would you like to explore?'}
            </span>
          </h1>
          <p className="text-stone-400 text-base md:text-lg max-w-2xl leading-relaxed">
            {isAmharic
              ? 'በጤና፣ ስፖርት፣ ቴክኖሎጂ፣ ታሪክ፣ ሳይንስ ወይም ፎቶ በማያያዝ ማንኛውንም ጥያቄ ይጠይቁ። እያንዳንዱን ጥያቄ በጥልቀት ተረድቶ ይመልሳል።'
              : 'Ask anything spanning health, sports, coding, history, education, or upload photos. Get deep, structured, authoritative answers.'}
          </p>
        </div>
      </div>

      {/* 4 Gemini-Style Starter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {geminiStarters.map((item, idx) => {
          const Icon = item.icon;
          const promptText = isAmharic ? item.descAm : item.descEn;
          return (
            <div
              key={idx}
              onClick={() => onSelectPrompt(promptText, item.style)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-stone-900/70 hover:bg-stone-850/90 border border-stone-800/80 hover:border-stone-700 shadow-lg hover:shadow-amber-500/5 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-stone-800 text-amber-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-100 text-sm md:text-base group-hover:text-amber-300 transition-colors">
                    {isAmharic ? item.titleAm : item.titleEn}
                  </h3>
                  <p className="text-xs md:text-sm text-stone-400 mt-1 leading-relaxed line-clamp-2">
                    {promptText}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Tabs & Full Prompt Library Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {isAmharic ? 'ተጨማሪ የተዘጋጁ ጥያቄዎች' : 'Prompt Explorer'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenPromptLibrary}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'የጥያቄዎች ማዕከል' : 'Prompt Library'}</span>
          </button>
        </div>

        {/* Categories scrollable pill list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-stone-900/90 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
                }`}
              >
                <span>{getCategoryIcon(cat.icon)}</span>
                <span>{isAmharic ? cat.nameAm : cat.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Prompts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPrompts.slice(0, 6).map((item) => {
            const styleObj = STYLE_OPTIONS.find((s) => s.id === item.recommendedStyle);
            return (
              <div
                key={item.id}
                onClick={() => onSelectPrompt(isAmharic ? item.promptAm : item.promptEn, item.recommendedStyle)}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-stone-900/50 hover:bg-stone-850 border border-stone-800/80 hover:border-amber-500/40 shadow-sm transition-all duration-200 cursor-pointer text-left"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 border border-stone-700/50">
                      {isAmharic ? styleObj?.labelAm : styleObj?.labelEn}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h4 className="font-semibold text-stone-200 text-xs md:text-sm group-hover:text-amber-300 transition-colors line-clamp-1">
                    {isAmharic ? item.titleAm : item.titleEn}
                  </h4>
                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {isAmharic ? item.promptAm : item.promptEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export type Language = 'am' | 'en';

export type ResponseStyle = 'balanced' | 'deep_dive' | 'step_by_step' | 'concise' | 'code_focus';

export interface StyleOption {
  id: ResponseStyle;
  labelAm: string;
  labelEn: string;
  descAm: string;
  descEn: string;
  icon: string;
}

export type DomainCategory = 'all' | 'health' | 'tech' | 'history' | 'sports' | 'education' | 'business';

export interface CategoryOption {
  id: DomainCategory;
  nameAm: string;
  nameEn: string;
  icon: string;
  color: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64 data URI
  size?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  style?: ResponseStyle;
  followups?: string[];
  isStreaming?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  style: ResponseStyle;
}

export interface PromptItem {
  id: string;
  category: DomainCategory;
  titleAm: string;
  titleEn: string;
  promptAm: string;
  promptEn: string;
  recommendedStyle: ResponseStyle;
  tags: string[];
}

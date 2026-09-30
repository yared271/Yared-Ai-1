import { marked, Renderer } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderer = new Renderer();

// Custom code block rendering with language badge and copy hook
renderer.code = function (token: any): string {
  const text = token.text || '';
  const language = token.lang || 'text';
  const escapedCode = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
    <div class="relative my-4 rounded-xl border border-stone-800 bg-stone-900/90 shadow-lg overflow-hidden group">
      <div class="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-950/60 text-xs font-mono text-stone-400">
        <span class="flex items-center gap-1.5 font-medium tracking-wide uppercase text-amber-400">
          <span class="inline-block w-2 h-2 rounded-full bg-amber-500/80"></span>
          ${language}
        </span>
        <button
          type="button"
          class="code-copy-btn flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans text-stone-300 bg-stone-800/80 hover:bg-stone-700/80 hover:text-white transition-all cursor-pointer border border-stone-700/60"
          data-code="${encodeURIComponent(text)}"
        >
          <svg class="w-3.5 h-3.5 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <span class="copy-label">ቅዳ / Copy</span>
        </button>
      </div>
      <div class="p-4 overflow-x-auto text-[13.5px] leading-relaxed font-mono text-stone-200">
        <pre><code class="language-${language}">${escapedCode}</code></pre>
      </div>
    </div>
  `;
};

// Custom blockquote
renderer.blockquote = function (token: any): string {
  const text = token.text || '';
  return `
    <blockquote class="my-3 border-l-4 border-amber-500/80 bg-amber-950/20 px-4 py-2.5 rounded-r-lg text-stone-300 italic text-sm">
      ${text}
    </blockquote>
  `;
};

marked.use({ renderer });

export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    return marked.parse(content) as string;
  } catch (err) {
    console.error('Failed to parse markdown:', err);
    return content;
  }
}

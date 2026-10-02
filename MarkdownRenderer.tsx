import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse lines into tokens
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockLines: string[] = [];

  const flushList = (key: string) => {
    if (!currentList) return null;
    const ListTag = currentList.type === 'ul' ? 'ul' : 'ol';
    const listClasses = currentList.type === 'ul' 
      ? 'list-disc pl-5 space-y-1.5 my-2.5 text-slate-700' 
      : 'list-decimal pl-5 space-y-1.5 my-2.5 text-slate-700';
    
    const element = (
      <ListTag key={key} className={listClasses}>
        {currentList.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
    return element;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code fence
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeBlockLines.join('\n');
        const blockIdx = i;
        renderedElements.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 text-xs sm:text-sm">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-slate-400 border-b border-slate-700/60 font-mono text-xs">
              <span>{codeBlockLanguage || 'code'}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(codeText, blockIdx)}
                className="flex items-center gap-1 hover:text-white transition-colors py-0.5 px-1.5 rounded cursor-pointer"
              >
                {copiedIndex === blockIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto font-mono text-slate-200 leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLanguage = '';
      } else {
        // Start code block
        if (currentList) {
          const el = flushList(`list-${i}`);
          if (el) renderedElements.push(el);
        }
        inCodeBlock = true;
        codeBlockLanguage = line.trim().replace(/^```/, '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Check for unordered list (- or *)
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) {
          const el = flushList(`list-${i}`);
          if (el) renderedElements.push(el);
        }
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[2]);
      continue;
    }

    // Check for ordered list (1. 2.)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) {
          const el = flushList(`list-${i}`);
          if (el) renderedElements.push(el);
        }
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // If we were in a list and hit non-list line, flush
    if (currentList) {
      const el = flushList(`list-${i}`);
      if (el) renderedElements.push(el);
    }

    // Headings
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={i} className="text-base sm:text-lg font-bold text-slate-800 mt-4 mb-1.5 flex items-center gap-2">
          {renderInlineMarkdown(line.replace('### ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={i} className="text-lg sm:text-xl font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-200">
          {renderInlineMarkdown(line.replace('## ', ''))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={i} className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-6 mb-2.5">
          {renderInlineMarkdown(line.replace('# ', ''))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote key={i} className="border-l-4 border-indigo-400 pl-3.5 py-1 my-2.5 text-slate-600 italic bg-indigo-50/40 rounded-r-md">
          {renderInlineMarkdown(line.replace(/^>\s*/, ''))}
        </blockquote>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      renderedElements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Standard paragraph
    renderedElements.push(
      <p key={i} className="my-1.5 leading-relaxed text-slate-700">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  if (currentList) {
    const el = flushList('list-end');
    if (el) renderedElements.push(el);
  }

  return <div className="space-y-0.5 text-sm sm:text-base leading-relaxed">{renderedElements}</div>;
};

// Formats inline bold (**), italic (*), inline code (`...`), and math notation
function renderInlineMarkdown(text: string): React.ReactNode {
  // Regex to split on bold, italic, code
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$\$[^\$]+\$\$|\$[^\$]+\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-xs text-indigo-700 font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    // Math block ($$ formula $$)
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      return (
        <span
          key={index}
          className="inline-block px-2 py-0.5 mx-1 font-mono text-xs sm:text-sm bg-indigo-50/80 text-indigo-900 border border-indigo-200/80 rounded"
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    // Inline math ($ formula $)
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return (
        <span
          key={index}
          className="inline-block px-1 py-0.5 mx-0.5 font-mono text-xs sm:text-sm bg-indigo-50/70 text-indigo-900 rounded font-medium"
        >
          {part.slice(1, -1)}
        </span>
      );
    }

    return part;
  });
}

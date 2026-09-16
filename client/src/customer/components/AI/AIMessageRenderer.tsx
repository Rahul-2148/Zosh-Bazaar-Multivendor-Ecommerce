import React from "react";

interface AIMessageRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe, zero-dependency Markdown renderer tailored for ecommerce conversational chat.
 * Parses headers, bold text, bullet points, numbered lists, and highlights without heavy dependencies.
 */
export const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({ content, className = "" }) => {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split("\n\n");

  const parseInline = (text: string): React.ReactNode => {
    // Matches **bold text**, `code/spec`, *italic*
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return (
          <em key={idx} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className={`space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Header ###
        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={bIdx}
              className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider pt-1 flex items-center gap-1.5"
            >
              {parseInline(trimmed.slice(4))}
            </h4>
          );
        }

        // Header ##
        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={bIdx}
              className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight pt-1.5"
            >
              {parseInline(trimmed.slice(3))}
            </h3>
          );
        }

        // Bulleted list (lines starting with • or - or *)
        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => /^\s*([•\-\*]|\d+\.)\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-1 my-1">
              {lines.map((line, lIdx) => {
                const bulletMatch = line.match(/^\s*([•\-\*]|\d+\.)\s+(.*)/);
                if (bulletMatch) {
                  const prefix = bulletMatch[1];
                  const itemContent = bulletMatch[2];
                  const isNumbered = /^\d+\./.test(prefix);

                  return (
                    <li key={lIdx} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 mt-0.5 font-bold text-[11px] ${
                          isNumbered
                            ? "w-4 h-4 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px]"
                            : "text-teal-600 dark:text-teal-400"
                        }`}
                      >
                        {isNumbered ? prefix.replace(".", "") : "•"}
                      </span>
                      <span className="flex-1">{parseInline(itemContent)}</span>
                    </li>
                  );
                }
                return <li key={lIdx}>{parseInline(line)}</li>;
              })}
            </ul>
          );
        }

        // Normal paragraph with linebreaks preserved
        return (
          <p key={bIdx} className="whitespace-pre-line">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {parseInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export default AIMessageRenderer;

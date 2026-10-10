import React from "react";

interface AIMessageRendererProps {
  content: string;
  className?: string;
}

/**
 * High-contrast, theme-adaptive Markdown renderer tailored for ecommerce conversational chat.
 * Parses headers, bold text, strikethrough, tables, bullet points, numbered lists, and inline code.
 * Guaranteed 100% readability across both Light and Dark modes using semantic theme tokens.
 */
export const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n{2,}/);

  const parseInline = (text: string): React.ReactNode => {
    // Matches **bold text**, ~~strikethrough~~, `code/spec`, *italic*
    const parts = text.split(/(\*\*.*?\*\*|~~.*?~~|`.*?`|\*.*?\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={idx}
            className="font-bold text-foreground dark:text-white"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("~~") && part.endsWith("~~")) {
        return (
          <del
            key={idx}
            className="line-through text-muted-foreground font-normal"
          >
            {part.slice(2, -2)}
          </del>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-muted text-teal-700 dark:text-teal-300 font-mono text-[11px] font-semibold border border-border/80"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (
        part.startsWith("*") &&
        part.endsWith("*") &&
        !part.startsWith("**")
      ) {
        return (
          <em
            key={idx}
            className="italic text-foreground/90 dark:text-slate-200"
          >
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const isTableBlock = (lines: string[]) => {
    if (lines.length < 2) return false;
    const isPipeLine = (l: string) =>
      l.trim().startsWith("|") && l.trim().endsWith("|");
    return lines.every((l) => isPipeLine(l) || /^\s*$/.test(l));
  };

  const renderTable = (lines: string[], key: number) => {
    const validLines = lines.filter(
      (l) => l.trim().startsWith("|") && l.trim().endsWith("|")
    );
    if (validLines.length < 2) return null;

    const parseRow = (line: string) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());

    const headerCells = parseRow(validLines[0]);
    const dataRows = validLines.slice(2).map(parseRow);

    return (
      <div
        key={key}
        className="my-2.5 overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs"
      >
        <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
          <thead>
            <tr className="bg-muted/70 border-b border-border/80">
              {headerCells.map((cell, cIdx) => (
                <th
                  key={cIdx}
                  className="px-2.5 py-2 font-black text-foreground dark:text-white uppercase tracking-wider text-[10px] sm:text-[11px]"
                >
                  {parseInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {dataRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-muted/40 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-2.5 py-2 text-foreground dark:text-slate-100 font-medium leading-normal"
                  >
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className={`space-y-2 text-xs sm:text-[13px] leading-relaxed text-foreground dark:text-slate-100 ${className}`}
    >
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n");

        // Markdown Table
        if (isTableBlock(lines)) {
          return renderTable(lines, bIdx);
        }

        // Header ###
        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={bIdx}
              className="text-xs sm:text-sm font-black text-foreground dark:text-white tracking-tight pt-1 flex items-center gap-1.5"
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
              className="text-sm sm:text-base font-black text-foreground dark:text-white tracking-tight pt-1.5"
            >
              {parseInline(trimmed.slice(3))}
            </h3>
          );
        }

        // Bulleted list (lines starting with • or - or * or numbers)
        const isBulletList = lines.every((l) =>
          /^\s*([•\-*]|\d+\.)\s+/.test(l)
        );

        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-0.5 my-1">
              {lines.map((line, lIdx) => {
                const bulletMatch = line.match(/^\s*([•\-*]|\d+\.)\s+(.*)/);
                if (bulletMatch) {
                  const prefix = bulletMatch[1];
                  const itemContent = bulletMatch[2];
                  const isNumbered = /^\d+\./.test(prefix);

                  return (
                    <li key={lIdx} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 mt-0.5 font-bold text-[11px] ${
                          isNumbered
                            ? "w-4 h-4 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px]"
                            : "text-teal-600 dark:text-teal-400"
                        }`}
                      >
                        {isNumbered ? prefix.replace(".", "") : "•"}
                      </span>
                      <span className="flex-1 text-foreground dark:text-slate-100">
                        {parseInline(itemContent)}
                      </span>
                    </li>
                  );
                }
                return (
                  <li
                    key={lIdx}
                    className="text-foreground dark:text-slate-100"
                  >
                    {parseInline(line)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Normal paragraph with linebreaks preserved
        return (
          <p
            key={bIdx}
            className="whitespace-pre-line text-foreground dark:text-slate-100"
          >
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

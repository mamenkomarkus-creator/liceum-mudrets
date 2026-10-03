import React from "react";

/** Inline emphasis of the lightweight markup: ***bold italic***, **bold**, *italic*, ==accent==. */
export function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on ***bold+italic***, **bold**, and *italic* without conflating them.
  const tokens = text
    .split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|==[^=]+==)/g)
    .filter((t) => t !== "");
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    if (token.startsWith("==") && token.endsWith("==") && token.length > 4) {
      return (
        <mark key={key} className="hl">
          {token.slice(2, -2)}
        </mark>
      );
    }
    if (token.startsWith("***") && token.endsWith("***")) {
      return (
        <strong key={key}>
          <em>{token.slice(3, -3)}</em>
        </strong>
      );
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{token}</React.Fragment>;
  });
}

const NBSP = " ";

/**
 * Binds short words (prepositions, conjunctions: «у», «на», «що», «як»…) and dashes to the
 * word that follows, so a heading never ends a line with a dangling «в» or starts one with «—».
 */
export function nbsp(text: string): string {
  return text
    .replace(/(?<![\p{L}\p{N}])(\p{L}{1,3})[ \t]+/gu, `$1${NBSP}`)
    .replace(/[ \t]+([—–])/g, `${NBSP}$1`);
}

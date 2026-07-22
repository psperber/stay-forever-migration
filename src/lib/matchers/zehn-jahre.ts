import type { Matcher } from "./types.js";

/**
 * Matches "10 Jahre Klüger" / "10 Jahre klüger" episodes to "Zehn Jahre Klüger" in new feed.
 *
 * Old: "10 Jahre Klüger: Juli 2009" or "10 Jahre klüger: 7/2008"
 * New: "Zehn Jahre Klüger: Juli 2009" or "Zehn Jahre Klüger: Juli 2008"
 *
 * Also handles "Nachgetragen: Zehn Jahre Klüger ..." prefix.
 */

const MONTH_MAP: Record<string, string> = {
  "1": "januar",
  "2": "februar",
  "3": "märz",
  "4": "april",
  "5": "mai",
  "6": "juni",
  "7": "juli",
  "8": "august",
  "9": "september",
  "10": "oktober",
  "11": "november",
  "12": "dezember",
};

interface ZjkParsed {
  month: string; // normalized month name
  year: string; // 4-digit year
}

function parseOldZjk(title: string): ZjkParsed | null {
  // "10 Jahre Klüger: September 2006" or "10 Jahre klüger: 9/2008"
  // "Nachgetragen: Zehn Jahre Klüger 7/2006 "Starforce...""
  const match = title.match(/^(?:Nachgetragen:\s*)?(?:10 Jahre|Zehn Jahre)\s*[Kk]lüger:?\s*(.+)$/i);
  if (!match) return null;

  // Strip quoted subtitle
  const rest = match[1].replace(/\s*"[^"]*"?\s*$/, "").trim();

  // Format: "9/2008" or "11/2008"
  const slashMatch = rest.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = MONTH_MAP[slashMatch[1]];
    if (!month) return null;
    return { month, year: slashMatch[2] };
  }

  // Format: "September 2006" or "Juli 2009"
  const wordMatch = rest.match(/^(\S+)\s+(\d{4})$/);
  if (wordMatch) {
    return { month: wordMatch[1].toLowerCase(), year: wordMatch[2] };
  }

  return null;
}

function parseNewZjk(title: string): ZjkParsed | null {
  // "Zehn Jahre Klüger: Juli 2008" or "Zehn Jahre klüger, April 2008"
  const match = title.match(/^Zehn Jahre [Kk]lüger[,:]\s*(\S+)\s+(\d{4})$/i);
  if (!match) return null;
  return { month: match[1].toLowerCase(), year: match[2] };
}

export const zehnJahreMatcher: Matcher = {
  name: "zehn-jahre-klueger",
  match(oldEpisode, newEpisodes, usedNewUuids) {
    const oldParsed = parseOldZjk(oldEpisode.title);
    if (!oldParsed) return undefined;

    for (const newEp of newEpisodes) {
      if (usedNewUuids.has(newEp.uuid)) continue;
      const newParsed = parseNewZjk(newEp.title);
      if (!newParsed) continue;
      if (oldParsed.month === newParsed.month && oldParsed.year === newParsed.year) {
        return newEp;
      }
    }

    return undefined;
  },
};

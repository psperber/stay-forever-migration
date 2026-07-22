import { normalizeTitle } from "./normalize.js";
import type { Matcher } from "./types.js";

/**
 * Fuzzy matching for titles that differ only by:
 * - Leading "Das"/"Der"/"Die" article
 * - Trailing "#0" vs no number
 * - "Folge #N" vs "#N"
 *
 * Examples:
 * - "Das Format ohne Namen #6" → "Format ohne Namen #6"
 * - "Format ohne Namen: Folge #2" → "Format ohne Namen #2"
 * - "Wissenslücken #0" → "Wissenslücken"
 */

function stripArticle(title: string): string {
  return title.replace(/^(Das|Der|Die)\s+/i, "");
}

function normalizeFolge(title: string): string {
  // "Format ohne Namen: Folge #2" → "Format ohne Namen #2"
  return title.replace(/:\s*Folge\s*#/i, " #");
}

function stripZeroSuffix(title: string): string {
  // "Wissenslücken #0" → "Wissenslücken"
  return title.replace(/\s*#0\s*$/, "");
}

function stripSubtitleAfterNumber(title: string): string {
  // "Format ohne Namen #2: Luxustelefone..." → "Format ohne Namen #2"
  return title.replace(/(#\d+)\s*[:-].+$/, "$1");
}

function stripFolgeOne(title: string): string {
  // "Format ohne Namen: Folge #1" → "Format ohne Namen"
  return title.replace(/[:\s]*Folge\s*#1\s*$/, "");
}

function variations(title: string): string[] {
  const results: string[] = [];
  const base = title;
  const stripped = stripArticle(base);
  const folge = normalizeFolge(base);
  const folgeStripped = stripArticle(folge);
  const noZero = stripZeroSuffix(base);
  const noZeroStripped = stripArticle(noZero);
  const noSubtitle = stripSubtitleAfterNumber(base);
  const noSubtitleStripped = stripArticle(noSubtitle);
  const noFolge1 = stripFolgeOne(base);
  const noFolge1Stripped = stripArticle(noFolge1);

  for (const v of [
    base,
    stripped,
    folge,
    folgeStripped,
    noZero,
    noZeroStripped,
    noSubtitle,
    noSubtitleStripped,
    noFolge1,
    noFolge1Stripped,
  ]) {
    results.push(normalizeTitle(v));
  }

  return [...new Set(results)];
}

export const fuzzyTitleMatcher: Matcher = {
  name: "fuzzy-title",
  match(oldEpisode, newEpisodes, usedNewUuids) {
    const oldVariations = variations(oldEpisode.title);

    for (const newEp of newEpisodes) {
      if (usedNewUuids.has(newEp.uuid)) continue;
      const newVariations = variations(newEp.title);

      for (const ov of oldVariations) {
        for (const nv of newVariations) {
          if (ov === nv) return newEp;
        }
      }
    }

    return undefined;
  },
};

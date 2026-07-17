import type { Episode } from "./types.js";

export interface EpisodeMatch {
  oldEpisode: Episode;
  newEpisode: Episode;
  source: string;
  matchMethod: "exact-title" | "normalized-title" | "prefix" | "date-and-duration" | "unmatched";
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function durationSimilar(a: number, b: number): boolean {
  return Math.abs(a - b) <= 60;
}

export function matchEpisodes(oldEpisodes: Episode[], newEpisodes: Episode[], source: string): EpisodeMatch[] {
  const newByTitle = new Map(newEpisodes.map((ep) => [ep.title, ep]));
  const newByNormalized = new Map(newEpisodes.map((ep) => [normalizeTitle(ep.title), ep]));
  const usedNewUuids = new Set<string>();

  const matches: EpisodeMatch[] = [];
  const unmatchedOld: Episode[] = [];

  for (const oldEp of oldEpisodes) {
    // 1. Exact title match
    const exactMatch = newByTitle.get(oldEp.title);
    if (exactMatch && !usedNewUuids.has(exactMatch.uuid)) {
      usedNewUuids.add(exactMatch.uuid);
      matches.push({ oldEpisode: oldEp, newEpisode: exactMatch, source, matchMethod: "exact-title" });
      continue;
    }

    // 2. Normalized title match
    const normalizedMatch = newByNormalized.get(normalizeTitle(oldEp.title));
    if (normalizedMatch && !usedNewUuids.has(normalizedMatch.uuid)) {
      usedNewUuids.add(normalizedMatch.uuid);
      matches.push({ oldEpisode: oldEp, newEpisode: normalizedMatch, source, matchMethod: "normalized-title" });
      continue;
    }

    // 3. Prefix match ("Stay Forever - " + old title)
    const prefixMatch = newByNormalized.get(normalizeTitle(`Stay Forever - ${oldEp.title}`));
    if (prefixMatch && !usedNewUuids.has(prefixMatch.uuid)) {
      usedNewUuids.add(prefixMatch.uuid);
      matches.push({ oldEpisode: oldEp, newEpisode: prefixMatch, source, matchMethod: "prefix" });
      continue;
    }

    unmatchedOld.push(oldEp);
  }

  // 4. Date + Duration match
  const stillUnmatched: Episode[] = [];
  for (const oldEp of unmatchedOld) {
    const candidate = newEpisodes.find(
      (ep) =>
        !usedNewUuids.has(ep.uuid) &&
        sameDay(ep.published, oldEp.published) &&
        durationSimilar(ep.duration, oldEp.duration),
    );
    if (candidate) {
      usedNewUuids.add(candidate.uuid);
      matches.push({ oldEpisode: oldEp, newEpisode: candidate, source, matchMethod: "date-and-duration" });
    } else {
      stillUnmatched.push(oldEp);
    }
  }

  // 5. Remaining are unmatched
  for (const oldEp of stillUnmatched) {
    matches.push({ oldEpisode: oldEp, newEpisode: undefined!, source, matchMethod: "unmatched" });
  }

  return matches;
}

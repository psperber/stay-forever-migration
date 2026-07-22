import {
  type EpisodeMatch,
  type Matcher,
  exactTitleMatcher,
  normalizedTitleMatcher,
  sfsSeasonMatcher,
  zehnJahreMatcher,
  dateAndDurationMatcher,
} from "./matchers/index.js";
import { STATIC_MATCHES, type StaticMatch } from "./matchers/static-table.js";
import type { Episode } from "./types.js";

export { normalizeTitle } from "./matchers/index.js";
export type { EpisodeMatch } from "./matchers/index.js";

/** Ordered list of matching strategies – first match wins. */
const matchers: Matcher[] = [
  exactTitleMatcher,
  normalizedTitleMatcher,
  sfsSeasonMatcher,
  zehnJahreMatcher,
  dateAndDurationMatcher,
];

function findStaticMatch(oldTitle: string, newEpisodes: Episode[], usedNewUuids: Set<string>): Episode | undefined {
  // Find matching key (prefix match to handle truncated API titles)
  let target: StaticMatch | undefined;
  for (const [key, value] of Object.entries(STATIC_MATCHES)) {
    if (oldTitle === key || oldTitle.startsWith(key)) {
      target = value;
      break;
    }
  }
  if (!target) return undefined;

  if ("title" in target) {
    return newEpisodes.find((ep) => !usedNewUuids.has(ep.uuid) && ep.title === target.title);
  }
  return newEpisodes.find(
    (ep) => !usedNewUuids.has(ep.uuid) && ep.season === target.season && ep.number === target.number,
  );
}

export function matchEpisodes(oldEpisodes: Episode[], newEpisodes: Episode[], source: string): EpisodeMatch[] {
  const usedNewUuids = new Set<string>();
  const matches: EpisodeMatch[] = [];

  for (const oldEp of oldEpisodes) {
    // 1. Check static table first
    const staticResult = findStaticMatch(oldEp.title, newEpisodes, usedNewUuids);
    if (staticResult) {
      usedNewUuids.add(staticResult.uuid);
      matches.push({ oldEpisode: oldEp, newEpisode: staticResult, source, matchMethod: "static" });
      continue;
    }

    // 2. Try matchers in order
    let matched = false;
    for (const matcher of matchers) {
      const result = matcher.match(oldEp, newEpisodes, usedNewUuids);
      if (result) {
        usedNewUuids.add(result.uuid);
        matches.push({ oldEpisode: oldEp, newEpisode: result, source, matchMethod: matcher.name });
        matched = true;
        break;
      }
    }

    if (!matched) {
      matches.push({ oldEpisode: oldEp, newEpisode: undefined!, source, matchMethod: "unmatched" });
    }
  }

  return matches;
}

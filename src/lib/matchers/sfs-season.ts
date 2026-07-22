import type { Matcher } from "./types.js";

/**
 * Matches old "SFS X: ... #Y" episodes to new episodes via season/number metadata.
 *
 * The SFS number in the old title corresponds to the season in the new feed:
 *   "SFS 13: Drachen von Laas #2" → season 13, number 2
 *
 * This is more robust than title matching because it doesn't depend on
 * game name spelling or formatting differences.
 */

const SFS_SEASON_PATTERN = /^SFS\s*(\d+):/i;
const EPISODE_NUMBER = /#(\d+)/;

function parseSfsSeasonAndNumber(title: string): { season: number; episode: number } | null {
  const seasonMatch = title.match(SFS_SEASON_PATTERN);
  if (!seasonMatch) return null;

  const numMatch = title.match(EPISODE_NUMBER);
  if (!numMatch) return null;

  return { season: parseInt(seasonMatch[1], 10), episode: parseInt(numMatch[1], 10) };
}

export const sfsSeasonMatcher: Matcher = {
  name: "sfs-season",
  match(oldEpisode, newEpisodes, usedNewUuids) {
    const parsed = parseSfsSeasonAndNumber(oldEpisode.title);
    if (!parsed) return undefined;

    return newEpisodes.find(
      (ep) => !usedNewUuids.has(ep.uuid) && ep.season === parsed.season && ep.number === parsed.episode,
    );
  },
};

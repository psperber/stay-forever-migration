import type { Episode } from "../types.js";

export interface EpisodeMatch {
  oldEpisode: Episode;
  newEpisode: Episode;
  source: string;
  matchMethod: string;
}

export interface Matcher {
  name: string;
  match(oldEpisode: Episode, newEpisodes: Episode[], usedNewUuids: Set<string>): Episode | undefined;
}

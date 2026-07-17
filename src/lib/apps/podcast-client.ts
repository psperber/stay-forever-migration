import type { Episode, EpisodeStatus, Podcast } from "../types.js";

/**
 * Interface for podcast app clients.
 * Implement this to add support for additional podcast apps.
 */
export interface PodcastClient {
  login(email: string, password: string): Promise<{ email: string }>;
  getPodcastList(): Promise<{ podcasts: Podcast[] }>;
  getEpisodes(podcastUuid: string): Promise<Episode[]>;
  getEpisodeStatus(podcastUuid: string): Promise<EpisodeStatus[]>;
  markEpisodePlayed(episodeUuid: string, podcastUuid: string): Promise<void>;
  markEpisodeInProgress(episodeUuid: string, podcastUuid: string, position: number): Promise<void>;
  archiveEpisodes(episodes: { uuid: string; podcast: string }[]): Promise<void>;
}

export interface PodcastApp {
  id: string;
  name: string;
  createClient(): PodcastClient;
}

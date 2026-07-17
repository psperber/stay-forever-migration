export const PlayingStatus = {
  NotPlayed: 0,
  InProgress: 2,
  Played: 3,
} as const;

export type PlayingStatus = (typeof PlayingStatus)[keyof typeof PlayingStatus];

export interface LoginResponse {
  email: string;
  uuid: string;
  isNew: boolean;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  createdAt: string;
}

export interface Podcast {
  uuid: string;
  title: string;
  author: string;
  description: string;
  url: string;
  lastEpisodePublished: string;
  unplayed: boolean;
  lastEpisodeUuid: string;
  folderUuid: string;
  sortPosition: number;
  dateAdded: string;
  episodesSortOrder: number;
  autoStartFrom: number;
  autoSkipLast: number;
}

export interface Episode {
  uuid: string;
  title: string;
  slug: string;
  url: string;
  file_type: string;
  file_size: number;
  duration: number;
  published: string;
  type: string;
  season?: number;
  number?: number;
}

export interface PodcastListResponse {
  podcasts: Podcast[];
}

export interface EpisodesResponse {
  uuid: string;
  episodes: Episode[];
}

export interface EpisodeStatus {
  uuid: string;
  podcastUuid: string;
  playingStatus: PlayingStatus;
  playedUpTo: number; // seconds
  isDeleted: boolean;
  starred: boolean;
}

export interface SubscriptionStatus {
  paid: number;
  platform: number;
  expiryDate: string;
  autoRenewing: boolean;
  tier: string;
}

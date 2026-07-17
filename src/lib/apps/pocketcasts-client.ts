import { fetch } from "undici";
import {
  PlayingStatus,
  type Episode,
  type EpisodeStatus,
  type LoginResponse,
  type PodcastListResponse,
  type SubscriptionStatus,
} from "../types.js";
import type { PodcastClient } from "./podcast-client.js";

const BASE_URL = "https://api.pocketcasts.com";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0";

export class PocketCastsClient implements PodcastClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/user/login_pocket_casts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ email, password, scope: "webplayer" }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LoginResponse;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    return data;
  }

  async refresh(): Promise<LoginResponse> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available. Call login() first.");
    }

    const response = await fetch(`${BASE_URL}/user/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        grantType: "refresh_token",
        refreshToken: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as LoginResponse;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    return data;
  }

  async getPodcastList(): Promise<PodcastListResponse> {
    const response = await this.authenticatedRequest(`${BASE_URL}/user/podcast/list`, {
      method: "POST",
      body: JSON.stringify({ v: 1 }),
    });
    return (await response.json()) as PodcastListResponse;
  }

  async getEpisodes(podcastUuid: string): Promise<Episode[]> {
    const data = JSON.parse(await this.getEpisodesRaw(podcastUuid)) as { podcast: { episodes: Episode[] } };
    return data.podcast.episodes;
  }

  async getEpisodesRaw(podcastUuid: string): Promise<string> {
    const url = `https://podcast-api.pocketcasts.com/podcast/full/${podcastUuid}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch episodes for ${podcastUuid}: ${response.status}`);
    }

    return await response.text();
  }

  async getEpisodeStatus(podcastUuid: string): Promise<EpisodeStatus[]> {
    const data = JSON.parse(await this.getEpisodeStatusRaw(podcastUuid)) as { episodes: EpisodeStatus[] };
    return data.episodes;
  }

  async getEpisodeStatusRaw(podcastUuid: string): Promise<string> {
    const response = await this.authenticatedRequest(`${BASE_URL}/user/podcast/episodes`, {
      method: "POST",
      body: JSON.stringify({ uuid: podcastUuid }),
    });
    return await response.text();
  }

  async markEpisodePlayed(episodeUuid: string, podcastUuid: string): Promise<void> {
    await this.authenticatedRequest(`${BASE_URL}/sync/update_episode`, {
      method: "POST",
      body: JSON.stringify({ uuid: episodeUuid, podcast: podcastUuid, status: PlayingStatus.Played }),
    });
  }

  async markEpisodeInProgress(episodeUuid: string, podcastUuid: string, position: number): Promise<void> {
    await this.authenticatedRequest(`${BASE_URL}/sync/update_episode`, {
      method: "POST",
      body: JSON.stringify({ uuid: episodeUuid, podcast: podcastUuid, status: PlayingStatus.InProgress, position }),
    });
  }

  async archiveEpisodes(episodes: { uuid: string; podcast: string }[]): Promise<void> {
    await this.authenticatedRequest(`${BASE_URL}/sync/update_episodes_archive`, {
      method: "POST",
      body: JSON.stringify({ episodes, archive: true }),
    });
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await this.authenticatedRequest(`${BASE_URL}/subscription/status`, { method: "GET" });
    return (await response.json()) as SubscriptionStatus;
  }

  private async authenticatedRequest(url: string, options: { method: string; body?: string }) {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Call login() first.");
    }

    const response = await fetch(url, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: options.body,
    });

    if (!response.ok) {
      throw new Error(`Request to ${url} failed: ${response.status}`);
    }

    return response;
  }
}

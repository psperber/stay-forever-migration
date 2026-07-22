import type { PodcastClient } from "./apps/podcast-client.js";
import type { EpisodeMatch } from "./match.js";
import { PlayingStatus } from "./types.js";
import type { EpisodeStatus } from "./types.js";

export async function syncPlayStatus(
  matches: EpisodeMatch[],
  getStatus: (m: EpisodeMatch) => EpisodeStatus | undefined,
  client: PodcastClient,
  podcastUuid: string,
  dryRun: boolean,
): Promise<void> {
  const toSync = matches.filter((m) => m.matchMethod !== "unmatched" && m.newEpisode);

  console.log(`\n--- MIGRATION${dryRun ? " (TROCKENLAUF)" : ""} ---`);
  console.log(`Synchronisiere Hörstatus für ${toSync.length} Episoden...`);

  let syncedCount = 0;
  for (const m of toSync) {
    const status = getStatus(m)!;

    if (!dryRun) {
      if (status.playingStatus === PlayingStatus.Played) {
        await client.markEpisodePlayed(m.newEpisode.uuid, podcastUuid);
      } else {
        await client.markEpisodeInProgress(m.newEpisode.uuid, podcastUuid, status.playedUpTo);
      }
    }
    syncedCount++;
    if (syncedCount % 50 === 0) {
      console.log(`  ...${syncedCount}/${toSync.length}`);
    }
  }
  console.log(`  ✅ Hörstatus für ${syncedCount} Episoden synchronisiert`);
}

export async function syncArchiveStatus(
  matches: EpisodeMatch[],
  getStatus: (m: EpisodeMatch) => EpisodeStatus | undefined,
  client: PodcastClient,
  podcastUuid: string,
  dryRun: boolean,
): Promise<void> {
  const toArchive = matches.filter((m) => {
    if (m.matchMethod === "unmatched" || !m.newEpisode) return false;
    const status = getStatus(m);
    return status !== undefined && status.isDeleted;
  });

  console.log(`Archiviere ${toArchive.length} Episoden (isDeleted=true)...`);

  if (!dryRun) {
    const BATCH_SIZE = 50;
    for (let i = 0; i < toArchive.length; i += BATCH_SIZE) {
      const batch = toArchive.slice(i, i + BATCH_SIZE);
      await client.archiveEpisodes(batch.map((m) => ({ uuid: m.newEpisode.uuid, podcast: podcastUuid })));
      console.log(`  ...${Math.min(i + BATCH_SIZE, toArchive.length)}/${toArchive.length}`);
    }
  }
  console.log(`  ✅ ${toArchive.length} Episoden archiviert`);
}

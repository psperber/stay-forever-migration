import { confirm } from "@inquirer/prompts";
import type { PodcastClient } from "./apps/podcast-client.js";
import { exportMatchesCsv } from "./csv-export.js";
import { matchEpisodes, type EpisodeMatch } from "./match.js";
import { syncPlayStatus, syncArchiveStatus } from "./sync.js";
import { PlayingStatus } from "./types.js";
import type { Episode, EpisodeStatus, Podcast } from "./types.js";

export interface MigrateOptions {
  client: PodcastClient;
  newPodcast: Podcast;
  oldPodcasts: Podcast[];
  dryRun: boolean;
  csvPath?: string;
}

interface Source {
  podcast: Podcast;
  episodes: Episode[];
  statusMap: Map<string, EpisodeStatus>;
}

export async function migrate({ client, newPodcast, oldPodcasts, dryRun, csvPath }: MigrateOptions): Promise<void> {
  const { sources, newEpisodes } = await fetchData(client, newPodcast, oldPodcasts);

  const playedOrInProgress = (status: EpisodeStatus | undefined) =>
    status !== undefined &&
    (status.playingStatus === PlayingStatus.Played || status.playingStatus === PlayingStatus.InProgress);

  printSourceSummary(sources, newEpisodes, playedOrInProgress);

  const { allMatches, allPlayedMatches } = matchAllSources(sources, newEpisodes, playedOrInProgress);

  const getStatus = (m: EpisodeMatch): EpisodeStatus | undefined => {
    const src = sources.find((s) => s.podcast.title === m.source);
    return src?.statusMap.get(m.oldEpisode.uuid);
  };

  if (csvPath) {
    exportMatchesCsv(csvPath, allPlayedMatches, getStatus);
  }

  const proceed = await confirm({ message: "Soll die Migration durchgeführt werden?" });
  if (!proceed) {
    console.log("Migration abgebrochen.");
    return;
  }

  await syncPlayStatus(allPlayedMatches, getStatus, client, newPodcast.uuid, dryRun);
  await syncArchiveStatus(allMatches, getStatus, client, newPodcast.uuid, dryRun);

  // Summary of unmatched episodes
  const allUnmatched = allPlayedMatches.filter((m) => m.matchMethod === "unmatched");
  if (allUnmatched.length > 0) {
    console.log(`\n⚠️  ${allUnmatched.length} gehörte Episoden konnten nicht zugeordnet werden:`);
    for (const m of allUnmatched) {
      console.log(`  - [${m.source}] ${m.oldEpisode.title}`);
    }
    console.log(`\nDiese Episoden müssen ggf. manuell im neuen Feed markiert werden.`);
  }

  console.log(`\n✅ Migration abgeschlossen!`);
}

async function fetchData(client: PodcastClient, newPodcast: Podcast, oldPodcasts: Podcast[]) {
  console.log("Lade Episoden und Hörstatus...");

  const [newEpisodes, ...oldData] = await Promise.all([
    client.getEpisodes(newPodcast.uuid),
    ...oldPodcasts.flatMap((p) => [client.getEpisodes(p.uuid), client.getEpisodeStatus(p.uuid)]),
  ]);

  const sources: Source[] = oldPodcasts.map((podcast, i) => ({
    podcast,
    episodes: oldData[i * 2] as Episode[],
    statusMap: new Map((oldData[i * 2 + 1] as EpisodeStatus[]).map((s) => [s.uuid, s])),
  }));

  return { sources, newEpisodes };
}

function printSourceSummary(
  sources: Source[],
  newEpisodes: Episode[],
  playedOrInProgress: (s: EpisodeStatus | undefined) => boolean,
) {
  console.log(`Ziel: ${newEpisodes.length} Episoden`);
  for (const src of sources) {
    const played = [...src.statusMap.values()].filter((s) => playedOrInProgress(s)).length;
    console.log(`Quelle "${src.podcast.title}": ${src.episodes.length} Episoden (${played} gehört/angefangen)`);
  }
}

function matchAllSources(
  sources: Source[],
  newEpisodes: Episode[],
  playedOrInProgress: (s: EpisodeStatus | undefined) => boolean,
) {
  const allMatches: EpisodeMatch[] = [];
  const allPlayedMatches: EpisodeMatch[] = [];

  for (const src of sources) {
    const sourceKey = src.podcast.title;
    const matches = matchEpisodes(src.episodes, newEpisodes, sourceKey);

    const playedMatches = matches.filter((m) => playedOrInProgress(src.statusMap.get(m.oldEpisode.uuid)));
    const playedUnmatched = playedMatches.filter((m) => m.matchMethod === "unmatched");
    const playedMatched = playedMatches.filter((m) => m.matchMethod !== "unmatched");

    console.log(`\n"${sourceKey}" (gehört/angefangen):`);
    console.log(`  Gesamt: ${playedMatches.length}`);
    console.log(`  Zugeordnet: ${playedMatched.length}`);
    console.log(`    - Exakt: ${playedMatches.filter((m) => m.matchMethod === "exact-title").length}`);
    console.log(`    - Normalisiert: ${playedMatches.filter((m) => m.matchMethod === "normalized-title").length}`);
    console.log(`    - Präfix: ${playedMatches.filter((m) => m.matchMethod === "prefix").length}`);
    console.log(`    - Datum+Dauer: ${playedMatches.filter((m) => m.matchMethod === "date-and-duration").length}`);
    console.log(`  Nicht zugeordnet: ${playedUnmatched.length}`);

    if (playedUnmatched.length > 0) {
      console.log(`\n  Nicht zugeordnete Episoden:`);
      for (const m of playedUnmatched.slice(0, 20)) {
        console.log(`    - ${m.oldEpisode.title}`);
      }
      if (playedUnmatched.length > 20) {
        console.log(`    ... und ${playedUnmatched.length - 20} weitere`);
      }
    }

    allMatches.push(...matches);
    allPlayedMatches.push(...playedMatches);
  }

  return { allMatches, allPlayedMatches };
}

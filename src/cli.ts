#!/usr/bin/env node
import { input, password, select, checkbox, confirm } from "@inquirer/prompts";
import { Command } from "commander";
import { PocketCastsClient } from "./lib/apps/pocketcasts-client.js";
import type { PodcastApp } from "./lib/apps/podcast-client.js";
import { migrate } from "./lib/migrate.js";
import type { Podcast } from "./lib/types.js";

const apps: PodcastApp[] = [{ id: "pocketcasts", name: "Pocket Casts", createClient: () => new PocketCastsClient() }];

const program = new Command();

program
  .name("stay-forever-migration")
  .description("Migriert den Hörstatus zwischen PocketCasts-Podcasts")
  .option("--dry-run", "Nur simulieren, keine Änderungen vornehmen")
  .option("-o, --output <datei>", "Matching-Ergebnisse als CSV exportieren")
  .helpOption("-h, --help", "Diese Hilfe anzeigen")
  .addHelpText(
    "after",
    "\nBeispiele:\n  stay-forever-migration --dry-run\n  stay-forever-migration --dry-run -o report.csv",
  )
  .action(async (opts: { dryRun?: boolean; output?: string }) => {
    const dryRun = opts.dryRun ?? false;

    console.log("🎙️  Stay Forever Migrations-Tool\n");

    if (dryRun) {
      console.log("🏜️  Trockenlauf — es werden keine Änderungen vorgenommen\n");
    }

    // Select podcast app
    const app =
      apps.length === 1
        ? apps[0]
        : await select<PodcastApp>({
            message: "Wähle die Podcast-App:",
            choices: apps.map((a) => ({ name: a.name, value: a })),
          });

    console.log(`📱 ${app.name}\n`);

    // Login
    const email = await input({ message: `${app.name} E-Mail:` });
    const pw = await password({ message: `${app.name} Passwort:` });

    const client = app.createClient();
    const loginResponse = await client.login(email, pw);
    console.log(`✅ Angemeldet als ${loginResponse.email}\n`);

    // Fetch podcasts
    const { podcasts } = await client.getPodcastList();
    const sortedPodcasts = podcasts.sort((a, b) => a.title.localeCompare(b.title));

    // Select target (new) podcast
    const newPodcast = await select<Podcast>({
      message: "Wähle den ZIEL-Podcast (neuer Feed):",
      choices: sortedPodcasts.map((p) => ({ name: p.title, value: p })),
    });

    // Select source (old) podcasts
    const remaining = sortedPodcasts.filter((p) => p.uuid !== newPodcast.uuid);
    const oldPodcasts = await checkbox<Podcast>({
      message: "Wähle QUELL-Podcasts (Leertaste = auswählen, Enter = bestätigen):",
      choices: remaining.map((p) => ({ name: p.title, value: p })),
      required: true,
    });

    console.log(`\nZiel: "${newPodcast.title}"`);
    console.log(`Quellen: ${oldPodcasts.map((p) => `"${p.title}"`).join(", ")}\n`);

    const proceed = await confirm({ message: "Migration starten?", default: true });
    if (!proceed) {
      console.log("Abgebrochen.");
      return;
    }

    await migrate({ client, newPodcast, oldPodcasts, dryRun, csvPath: opts.output });
  });

program.parseAsync().catch((error) => {
  console.error("Migration fehlgeschlagen:", error);
  process.exit(1);
});

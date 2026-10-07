# Player data and app updates

This document explains how PMP Daily saves progress and what keeps that progress safe when a new version is released.

**Short version:** progress is stored on the phone and survives updates, as long as the signing key, app ID, WebView address, and storage key never change.

## How progress is saved

Everything is a single JSON record in the WebView's `localStorage`, under the key `pmp-daily:v1` (see `src/lib/store.svelte.ts`). It is written every time a quiz finishes.

| Field | Contents |
|---|---|
| `sessions` | Every quiz taken: mode, date, each answer, whether it was right, time taken |
| `qstats` | Per-question counts and the spaced-review schedule (Leitner box and due date) |
| `xp` | Total XP |
| `settings` | Sound, haptics, exam date |

Mastery scores, performance bands, readiness, and streaks are **not stored**. They are recalculated from `sessions` each time (`src/lib/analytics.ts`), so improving the scoring formula also updates past results.

The data lives in the app's private storage on Android. Nothing is sent to a server.

## What happens on an update

Installing a new APK over the old one is an Android update, and Android keeps the app's data. Players keep their progress **only if all of these stay the same**:

| Must stay the same | What breaks if it changes |
|---|---|
| **Signing key** (`release.p12`, also the `ANDROID_KEYSTORE_*` GitHub secrets) | Android refuses the update. Players must uninstall, which wipes all progress. |
| **App ID** `com.jjwallace.pmpdaily` (`identifier` in `src-tauri/tauri.conf.json`) | The new version installs as a separate app with empty storage. |
| **WebView address** (Tauri's default `http://tauri.localhost`) | `localStorage` is tied to this address. Changing it, for example by enabling Tauri's `useHttpsScheme` option, silently hides all old data. |
| **Storage key** `pmp-daily:v1` | Renaming it starts every player from zero. |

The signing key is kept outside the repo. Back it up. If it is lost, no future update can install over existing copies of the app.

## Changing questions

Questions are matched to saved answers by their `id`.

| Change | Effect on saved progress |
|---|---|
| Add questions | Safe |
| Remove a question | Safe. Old answers to it are skipped in scoring and review. |
| Edit a question, keep its `id` | History is kept. If its exam task changes, past answers count toward the new task. |
| Change a question's `id` | Its old history is orphaned. **Keep IDs stable.** |

Run `npm run validate` after any change to the question bank.

## What can still lose data

- **Uninstalling the app**, or "Clear data" in Android settings, deletes everything. The only safeguard today is **Settings → Export backup**, which players have to do by hand.
- **Changing the shape of the saved data.** On load, saved data is merged loosely into the current shape (`load()` in `src/lib/store.svelte.ts`). There is no migration step yet. Adding new fields with defaults is fine. Renaming or restructuring existing fields needs a migration written first.

## Recommended improvements

These are not done yet. Each should copy existing progress over automatically on first launch, so current players lose nothing.

1. **Versioned migrations.** Bump `version` in the saved data and run upgrade functions on load when the stored version is older.
2. **File-based storage** with Tauri's store plugin. It is sturdier than WebView storage and does not depend on the WebView address.
3. **Automatic backups**, for example a dated backup file written after each quiz, so an uninstall is not a total loss.

## Release checklist

Before tagging a new version:

- [ ] `identifier` in `src-tauri/tauri.conf.json` is still `com.jjwallace.pmpdaily`
- [ ] No `useHttpsScheme` or other WebView address change
- [ ] Storage key in `src/lib/store.svelte.ts` is still `pmp-daily:v1`, or a migration copies the old data
- [ ] No question `id` was renamed
- [ ] `npm run validate` passes
- [ ] Bump `version` in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`, then push a `v*` tag

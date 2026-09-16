# Lag-app

En app för idrottslag som ersätter Qridi/laget.se. MVP enligt spec: klubbanpassad
branding, en kalender som fungerar (med RSVP) och en chatt som inte känns seg
(realtid via websockets, inte polling).

Byggd som Next.js (App Router) + Supabase (Postgres, Auth, Realtime, Storage), per
den snabba PWA-vägen i specen — en kodbas, ingen egen auth/realtime-backend att bygga.

## Funktioner

- **Team setup / branding** — admin skapar ett lag med namn, primär-/sekundärfärg och
  logga. Hela UI:t (headers, knappar, chip-ytor) drivs av CSS-designtokens satta från
  lagets färger (`src/lib/theme.ts`, `src/app/globals.css`) — inga hårdkodade färger.
  Admin bjuder in spelare via kod eller länk (`/join?code=...`).
- **Kalender** — lista + månadsvy, händelsetyper (Träning/Match/Övrigt), admin
  skapar/redigerar/tar bort, spelare RSVP:ar (Kommer/Osäker/Kommer inte). Realtidssynk
  via Supabase Realtime — ingen sidladdning.
- **Chatt** — en gruppkanal per lag, meddelanden i realtid, bilduppladdning,
  "sedd av"-indikator, optimistisk sändning.
- **Roller** — admin (tränare/lagledare) vs. spelare, med databasnivå-behörigheter
  (Row Level Security), inte bara UI-gömda knappar.

Explicit utanför scope i v1 (se spec): formationer/taktiktavla, video, sömn/återhämtning,
reselogistik, fakturering, övningsbank.

## Komma igång

1. Skapa ett projekt på [supabase.com](https://supabase.com).
2. Kör `supabase/migrations/0001_init.sql` i Supabase SQL Editor (eller via
   `supabase db push` om du kör Supabase CLI lokalt). Det skapar tabeller, RLS-policyer,
   hjälpfunktioner (`create_team`, `join_team`, m.fl.) och storage-buckets för loggor
   och chattbilder.
3. Kopiera `.env.example` till `.env.local` och fyll i din Supabase-URL och anon-nyckel
   (Project Settings → API).
4. Installera beroenden och starta:

   ```bash
   npm install
   npm run dev
   ```

5. Öppna [http://localhost:3000](http://localhost:3000), skapa ett konto, skapa ett lag
   (du blir admin) och bjud in resten av laget med koden som visas under Inställningar.

## Arkitektur

- `src/app/(app)/` — den inloggade appen (kalender, chatt, laget, inställningar) bakom
  ett delat layout-skal som läser lagets tema och roll server-side.
- `src/lib/actions/` — server actions för alla mutationer (auth, team, events, chat,
  members). RLS i databasen är den egentliga behörighetsgränsen; server actions är en
  bekväm yta, inte säkerhetsgränsen i sig.
- `src/lib/supabase/` — browser-/server-/middleware-klienter för Supabase enligt
  `@supabase/ssr`-mönstret (cookie-baserad session).
- `supabase/migrations/0001_init.sql` — hela datamodellen: `teams`, `profiles`,
  `events`, `rsvps`, `messages`, `chat_reads`, plus RLS-policyer och SECURITY DEFINER-
  funktioner för att skapa/gå med i lag och hantera medlemmar utan att öppna upp
  privilege-escalation-hål (en spelare kan t.ex. inte sätta sin egen `role` till admin).
- Realtid: Supabase Realtime (`postgres_changes`) på `events`, `rsvps`, `messages` och
  `chat_reads`, scopat till laget via RLS.

## Push-notiser

Specen efterfrågar push vid nya händelser/ändringar/påminnelser och för nya
meddelanden. Det här är byggt hittills:

- En service worker (`public/sw.js`) och `manifest.json` gör appen installerbar (PWA)
  och kan ta emot Web Push-events.
- `src/components/notification-setup.tsx` registrerar service workern och frågar om
  lov till **lokala** notiser (webbläsarens Notification API).
- Kalender- och chattvyerna skickar en lokal notis när en realtidsuppdatering kommer in
  medan fliken inte är synlig, plus en 2-timmars-påminnelse innan varje händelse
  (schemalagd client-side med `setTimeout` medan appen är öppen).

Detta täcker "känns snabbt, inga sidladdningar", men är **inte** riktig push som når
en stängd app — det kräver en riktig push-provider (Firebase Cloud Messaging, enligt
specens rekommendation) med egna projektuppgifter som du behöver skapa. För att koppla
på det: lägg en Supabase Database Webhook eller Edge Function-trigger på `insert` i
`events`/`messages` som anropar FCM med användarnas sparade push-tokens. `sw.js` har
redan en `push`-listener som visar det den får, så serverdelen är det enda som
saknas.

## Tekniska val vs. specens rekommendationer

- **Cross-platform**: byggt som PWA/webbapp enligt specens "om tid är superbegränsat,
  bygg webbapp först" — samma kodbas kan senare paketeras med Capacitor eller
  migreras till React Native för native-appar.
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage) enligt specens
  rekommendation, för att slippa bygga auth/databas/realtidssynk från grunden.
- **Realtid**: Supabase Realtime (websockets), inte polling.
- **Autentisering**: e-post/lösenord och magic link, ingen känslig data.

## Säkerhetsanteckningar

- Storage-policyerna för `logos`/`chat-images` tillåter alla inloggade användare att
  ladda upp (inte bara det egna laget) eftersom Supabase Storage-RLS inte enkelt kan
  läsa `team_id` ur filsökvägen utan mer uppsättning. Filer är inte känsliga (loggor,
  chattbilder) så det är en medveten avvägning för en MVP — strama åt om det behövs.

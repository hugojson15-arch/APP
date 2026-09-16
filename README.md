# Lag-app

En app för idrottslag som ersätter Qridi/laget.se. MVP enligt spec: klubbanpassad
branding, en kalender som fungerar (med RSVP) och en chatt som inte känns seg
(realtid via websockets, inte polling).

Byggd som Next.js (App Router) + Supabase (Postgres, Auth, Realtime, Storage), per
den snabba PWA-vägen i specen — en kodbas, ingen egen auth/realtime-backend att bygga.

## Funktioner

- **Team setup / branding** — admin skapar ett lag med namn, tre märkesfärger
  (primär/sekundär/accent) och logga. Hela UI:t (headers, knappar, chip-ytor) drivs
  av CSS-designtokens satta från lagets färger (`src/lib/theme.ts`,
  `src/app/globals.css`) — inga hårdkodade färger. Standardfärgerna är röd/svart/gul
  (à la Luleå HF) men varje lag väljer sina egna. Admin bjuder in spelare via kod
  eller länk (`/join?code=...`).
- **Loggan på hemskärmen** — laddar en admin upp en logga blir den appens PWA-ikon
  *för det laget*: `src/app/manifest.ts`, `src/app/icon.ts` och
  `src/app/apple-icon.ts` är dynamiska (per inloggad användares lag, inte statiska
  filer), så "Lägg till på hemskärmen" visar rätt lags logga och namn — inte en
  generisk app-ikon. Utan inloggning/logga faller det tillbaka till den generiska
  Lag-app-märket.
- **Kalender** — lista + månadsvy, händelsetyper (Träning/Match/Övrigt), admin
  skapar/redigerar/tar bort, spelare RSVP:ar (Kommer/Osäker/Kommer inte). Realtidssynk
  via Supabase Realtime — ingen sidladdning.
- **Chatt** — en gruppkanal per lag, meddelanden i realtid, bilduppladdning,
  "sedd av"-indikator, optimistisk sändning.
- **Lineup i chatten** — admin trycker 🏒 i chatten, tilldelar varje spelare i
  truppen ett tröjnummer och en position (Forward/Back/Målvakt) i en enkel lista,
  ser en levande förhandsvisning i lagets färger, och postar den som en bild i
  gruppchatten (`src/app/(app)/chat/lineup-composer.tsx` + `lineup-card.tsx`).
  Bilden renderas i webbläsaren från lagets faktiska logga/färger (`html-to-image`)
  och skickas via samma bilduppladdningsväg som vanliga chattbilder. Tröjnummer/
  position sparas på spelaren så de är förifyllda nästa gång. Detta är en lätt
  variant av "laguppställningar" — inte en fullständig taktiktavla (se scope
  nedan).
- **Coachverktyg** (`/drills`, tre flikar) — admin-only att skapa/hantera, hela laget
  kan läsa:
  - **Övningar** — rita upp en övning/taktik på en ishockeyrink (hel/halv/neutral
    zon): spelare (egna/motstånd), puck, koner, text och tre sorters pilar
    (skridsko/passning/skott). En scrollbar snabbstart-meny med Powerplay/Boxplay-
    flikar fyller i kända formationer (PP1, PP2/Paraply, PK Forwards, PK Backar) —
    varje formation *läggs till* på ritytan istället för att ersätta den, så t.ex.
    PK Forwards + PK Backar går att kombinera till en hel boxplay-box. Sparas som
    strukturerad data (`drills.drawing_data`, inte bara en bild — går att bygga
    vidare på senare) och postas som en ögonblicksbild i chatten med en
    knapptryckning. Byggt med `konva`/`react-konva` (`src/app/(app)/drills/`);
    rendering av kanvasen är webbläsar-only, laddas via `next/dynamic({ ssr: false
    })` eftersom Konva rör vid `window` vid import.
  - **Scouting** — enkla rapporter per motståndare (forecheck, förväntad
    powerplay-uppställning, tekningstendenser) som fritext. Ersätter den "Taktik"-
    flik som ursprungligen var tänkt som ett formationsbibliotek.
  - **Videor** — tränare laddar upp videoklipp (träning/match), spelas upp direkt i
    appen. Laddas upp **direkt från webbläsaren till Supabase Storage**, inte via
    en server action — se säkerhets-/teknikanteckningen om `bodySizeLimit` nedan.
- **Lineup i chatten** — admin trycker 🏒 i chatten, tilldelar varje spelare i
  truppen ett tröjnummer och en position (Forward/Back/Målvakt) i en enkel lista,
  ser en levande förhandsvisning i lagets färger, och postar den som en bild i
  gruppchatten (`src/app/(app)/chat/lineup-composer.tsx` + `lineup-card.tsx`).
  Bilden renderas i webbläsaren från lagets faktiska logga/färger (`html-to-image`)
  och skickas via samma bilduppladdningsväg som vanliga chattbilder. Tröjnummer/
  position sparas på spelaren så de är förifyllda nästa gång.
- **Roller** — admin (tränare/lagledare) vs. spelare, med databasnivå-behörigheter
  (Row Level Security), inte bara UI-gömda knappar.

Ursprungsspecen listade uttryckligen "formationer/taktiktavla" och "video" som
utanför scope för v1 — båda byggdes ändå, på uttrycklig begäran, som tydligt
avgränsade MVP:er (rita och dela; ladda upp och spela upp — inte en fullständig
tränings-/videoanalysplattform). Fortfarande utanför scope: sömn/återhämtning,
reselogistik, fakturering, en delad övningsbank/publikt bibliotek, videoklipp-
klippning/anteckningar per tidsstämpel, och animerad uppspelning av övningar
steg-för-steg (à la CoachThem).

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
  `events`, `rsvps`, `messages`, `chat_reads`, `drills`, `scouting_reports`,
  `videos`, plus RLS-policyer och SECURITY DEFINER-funktioner för att skapa/gå med
  i lag och hantera medlemmar utan att öppna upp privilege-escalation-hål (en
  spelare kan t.ex. inte sätta sin egen `role` till admin).
- Realtid: Supabase Realtime (`postgres_changes`) på `events`, `rsvps`, `messages` och
  `chat_reads`, scopat till laget via RLS.
- `src/lib/team-brand.ts` — slår upp den inloggade användarens lag (namn, färger,
  logga) och används av `manifest.ts`/`icon.ts`/`apple-icon.ts` för att göra
  PWA-ikonen och namnet lag-specifika.

## Push-notiser

Specen efterfrågar push vid nya händelser/ändringar/påminnelser och för nya
meddelanden. Det här är byggt hittills:

- En service worker (`public/sw.js`) och en dynamisk, per-lag `manifest.ts` gör appen
  installerbar (PWA) och kan ta emot Web Push-events.
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

- Storage-policyerna för `logos`/`chat-images`/`drills`/`videos` tillåter alla
  inloggade användare att ladda upp (inte bara det egna laget) eftersom Supabase
  Storage-RLS inte enkelt kan läsa `team_id` ur filsökvägen utan mer uppsättning.
  Filer är inte känsliga (loggor, chattbilder, ritade övningar, träningsklipp) så
  det är en medveten avvägning för en MVP — strama åt om det behövs.

## Teknisk anteckning: server action-uppladdningar

Next.js server actions har som standard en gräns på **1 MB** per request
(`experimental.serverActions.bodySizeLimit`). Den var inte satt här, vilket i
praktiken satte ett osynligt tak på varje bilduppladdning som går via en server
action (logga, chattbild, lineup-/övningsbild) — allt över ~1 MB (en vanlig
telefonbild, eller en hi-DPI canvas-export) skulle tyst misslyckas. Fixat i
`next.config.ts` genom att höja gränsen till 15 MB.

Videoklipp är en annan sak — de kan lätt bli hundratals MB, vilket 15 MB inte
räcker till. `videos-view.tsx` laddar därför upp **direkt från webbläsaren till
Supabase Storage** med den vanliga Supabase JS-klienten, helt utan att gå via en
Next.js server action (RLS på `storage.objects` skyddar uppladdningen ändå).
Databasraden i `videos`-tabellen infogas på samma sätt, direkt från klienten.

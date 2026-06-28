# TimeTable — your day, mastered ⏱️

A fully personalized productivity app for a software engineer: daily schedule, a
real calendar, custom tasks, **coding goals**, **food management**, **office
hours**, and **analytics** that tell you which days you're off-track and *where
to improve* — plus **SMS reminders** sent from your own phone.

Built with **Next.js (App Router) + TypeScript + Tailwind + MongoDB (Mongoose)**.

![stack](https://img.shields.io/badge/Next.js-14-black) ![db](https://img.shields.io/badge/MongoDB-Mongoose-green) ![ts](https://img.shields.io/badge/TypeScript-strict-blue)

---

## ✨ Features

| Area | What you get |
|------|--------------|
| **Dashboard** | Greeting, today's stats, up-next tasks, progress rings, live insights |
| **Day Schedule** | Per-day timeline, add/edit/complete/miss/skip tasks, day navigation |
| **Calendar** | Month grid with per-day task dots & completion, click a day to plan |
| **Coding** | Daily coding-minute goal, 14-day bar chart, streak counter |
| **Food** | Log meals by type (breakfast/lunch/dinner/snack), healthy flag, calories |
| **Analytics** | Daily adherence score, on/off-track days, time-split, **personalized suggestions** |
| **Settings** | Office hours & days, wake/sleep, goals, meal schedule, reminders, SMS toggle |
| **Reminders** | Cron-driven SMS via an Android gateway on your phone (from your real SIM) |

### How "on track" is measured
Each active day gets a **0–100 adherence score** blending:
- task completion (60%)
- coding-goal progress (25%)
- meal healthiness (15%)

Days scoring **≥ 70 are "on track."** The analytics engine
([`src/lib/analytics.ts`](src/lib/analytics.ts)) then generates suggestions like
*"Saturdays are your weak spot"*, *"You're over-planning your days"*, or
*"Office hours dominate your time — add a 25-min coding sprint."*

---

## 🚀 Getting started

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and set at least `MONGODB_URI`:
- **Local Mongo:** `mongodb://127.0.0.1:27017/timetable`
- **MongoDB Atlas (free):** `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/timetable`

> `.env.local` is gitignored. **Never commit secrets** (Mongo URI, SMS keys).

### 3. (Optional) Seed sample data
Populates ~2 weeks of tasks & meals so charts have something to show:
```bash
npm run seed              # add sample data
npm run seed -- --reset   # wipe tasks/food first, then seed
```

### 4. Run
```bash
npm run dev      # http://localhost:3000
# or
npm run build && npm start
```

---

## 📲 SMS reminders (from YOUR number)

Carriers don't let a server send SMS from your personal SIM directly, so this
app uses an **Android SMS gateway app** on your phone. Your machine POSTs the
message to the phone; the phone sends the SMS from your real number
(`7989872556` → `9390434621`).

### Setup
1. Install an SMS gateway app on your Android phone. Recommended:
   [**capcom6/android-sms-gateway**](https://github.com/capcom6/android-sms-gateway)
   (open source) — run it in **Local server** mode.
2. Note the URL it shows (e.g. `http://192.168.1.20:8080/message`) and any
   username/password it generates.
3. Fill these in `.env.local`:
   ```ini
   SMS_GATEWAY_URL=http://192.168.1.20:8080/message
   SMS_GATEWAY_USERNAME=sms
   SMS_GATEWAY_PASSWORD=yourpass
   SMS_FROM=7989872556
   SMS_TO=9390434621
   SMS_ENABLED=true
   ```
4. In the app's **Settings**, toggle **"Send real SMS"** on and define your
   reminders (label, time, message, days).

> Keep `SMS_ENABLED=false` while testing — the notify script then only logs what
> it *would* send (dry run). The `sendSms` helper
> ([`src/lib/sms.ts`](src/lib/sms.ts)) builds a generic payload that works with
> most gateway apps; tweak it if your app expects a different shape.

### The notify scheduler
[`scripts/notify.mjs`](scripts/notify.mjs) asks the app which reminders/tasks are
due *right now* (via `/api/notify`) and sends them.

```bash
node scripts/notify.mjs            # normal (sends what's due this minute)
node scripts/notify.mjs --force    # preview ALL of today's reminders
node scripts/notify.mjs --dry      # never send, just print
```

Run it every minute with **cron** (keep the app running, e.g. `npm start`):
```cron
* * * * * cd /path/to/TimeTable && /usr/bin/node scripts/notify.mjs >> /tmp/timetable-notify.log 2>&1
```
On macOS you can also use `launchd`. Task reminders fire `lead` minutes before a
task's start time (default 10); configured reminders fire at their set time.

---

## 🗂️ Project structure

```
src/
  app/
    page.tsx              # Dashboard
    schedule/             # Day timeline
    calendar/             # Month view
    coding/               # Coding goals + streak
    food/                 # Meal logging
    analytics/            # Charts + suggestions
    settings/             # Config + reminders
    api/                  # tasks, food, settings, analytics, notify
  components/             # Sidebar, modals, task rows, UI primitives
  lib/
    db.ts                 # Mongoose connection (cached)
    models/               # Task, FoodLog, Settings schemas
    analytics.ts          # Scoring + suggestion engine
    sms.ts                # Android gateway integration
    date.ts, types.ts, api.ts
scripts/
  notify.mjs              # cron → SMS
  seed.mjs               # sample data
```

## 🔌 API
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/tasks` | list (by `date` or `from`/`to`/`category`) / create |
| PATCH/DELETE | `/api/tasks/:id` | update (status, fields) / delete |
| GET/POST | `/api/food` | list / create meal logs |
| PATCH/DELETE | `/api/food/:id` | update / delete |
| GET/PUT | `/api/settings` | read / upsert settings |
| GET | `/api/analytics?from=&to=` | computed stats + suggestions |
| GET/POST | `/api/notify?force=&dry=&lead=&window=` | evaluate & send due reminders |

---

## 🛣️ Roadmap (later)
- Recurring tasks & templates
- Google Calendar / Gmail sync (MCP-ready)
- Weekly email digest
- Push notifications (PWA) as an SMS alternative
- Multi-user auth

---

Made for Vishwak. Personal use.

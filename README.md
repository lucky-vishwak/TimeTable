# TimeTable — your day, mastered ⏱️

A fully personalized productivity app for a software engineer: daily schedule, a
real calendar, custom tasks, **focus/productive goals**, **food management**, a
**life journal**, **office hours**, and **analytics** that tell you which days
you're off-track and *where to improve* — plus **native macOS reminders** driven
by your schedule.

Built with **Next.js (App Router) + TypeScript + Tailwind + MongoDB (Mongoose)**.

![stack](https://img.shields.io/badge/Next.js-14-black) ![db](https://img.shields.io/badge/MongoDB-Mongoose-green) ![ts](https://img.shields.io/badge/TypeScript-strict-blue)

---

## ✨ Features

| Area | What you get |
|------|--------------|
| **Dashboard** | Greeting, today's stats, up-next tasks, progress rings, live insights |
| **Day Schedule** | Per-day timeline, add/edit/complete/miss/skip tasks, day navigation |
| **Calendar** | Month grid with per-day task dots & completion, click a day to plan |
| **Tasks** | Productive/growth work (projects, learning, coding…): daily focus-minute goal, 14-day chart, streak |
| **Food** | Log meals by type (breakfast/lunch/dinner/snack), healthy flag, calories |
| **Journal** | End-to-end day timeline (tasks + meals + life moments) and search across all memories |
| **Analytics** | Daily adherence score, on/off-track days, time-split, **personalized suggestions** |
| **Settings** | Office hours & days, wake/sleep, goals, meal schedule, reminders |
| **Reminders** | Cron-driven native macOS notifications from your schedule |

### How "on track" is measured
Each active day gets a **0–100 adherence score** blending:
- task completion (60%)
- focus-goal progress (25%)
- meal healthiness (15%)

Days scoring **≥ 70 are "on track."** The analytics engine
([`src/lib/analytics.ts`](src/lib/analytics.ts)) then generates suggestions like
*"Saturdays are your weak spot"*, *"You're over-planning your days"*, or
*"Office hours dominate your time — add a 25-min focus sprint."*

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

> `.env.local` is gitignored. **Never commit secrets** (e.g. your Mongo URI).

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

## 🔔 Reminders (native macOS notifications)

Define reminders in the app's **Settings** (label, time, message, days). The
scheduler [`scripts/notify.mjs`](scripts/notify.mjs) asks the app which
reminders/tasks are due *right now* (via `/api/notify`) and pops a **native
macOS notification** for each one (via `osascript`).

```bash
node scripts/notify.mjs            # notify what's due this minute
node scripts/notify.mjs --force    # show ALL of today's reminders right now
node scripts/notify.mjs --dry      # never notify, just print
```

> macOS may ask once for permission to send notifications / run `osascript` —
> allow it.

Run it every minute with **cron** (keep the app running, e.g. `npm start`):
```cron
* * * * * cd /path/to/TimeTable && /usr/bin/node scripts/notify.mjs >> /tmp/timetable-notify.log 2>&1
```
On macOS you can also use `launchd`. Task reminders fire `lead` minutes before a
task's start time (default 10); configured reminders fire at their set time.

> **Why not SMS from your number?** iOS sandboxing makes it impossible to send
> SMS from your personal SIM programmatically (no gateway app exists for iOS), so
> this build uses macOS notifications instead. If you ever switch to an Android
> phone and want true SMS-from-your-SIM, that can be added back as an option.

---

## 🗂️ Project structure

```
src/
  app/
    page.tsx              # Dashboard
    schedule/             # Day timeline
    calendar/             # Month view
    tasks/                # Focus/productive goals + streak
    food/                 # Meal logging
    journal/              # End-to-end day timeline + memory search
    analytics/            # Charts + suggestions
    settings/             # Config + reminders
    api/                  # tasks, food, lifelog, settings, analytics, notify
  components/             # Sidebar, modals, task rows, UI primitives
  lib/
    db.ts                 # Mongoose connection (cached)
    models/               # Task, FoodLog, LifeLog, Settings schemas
    analytics.ts          # Scoring + suggestion engine
    date.ts, types.ts, api.ts
scripts/
  notify.mjs              # cron → macOS notifications
  seed.mjs               # sample data
```

## 🔌 API
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/tasks` | list (by `date` or `from`/`to`/`category`) / create |
| PATCH/DELETE | `/api/tasks/:id` | update (status, fields) / delete |
| GET/POST | `/api/food` | list / create meal logs |
| PATCH/DELETE | `/api/food/:id` | update / delete |
| GET/POST | `/api/lifelog` | list (by `date`/range, `type`, or `q` search) / create |
| PATCH/DELETE | `/api/lifelog/:id` | update / delete |
| GET/PUT | `/api/settings` | read / upsert settings |
| GET | `/api/analytics?from=&to=` | computed stats + suggestions |
| GET/POST | `/api/notify?force=&lead=&window=` | list reminders/tasks due now |

---

## 🛣️ Roadmap (later)
- Recurring tasks & templates
- Google Calendar / Gmail sync (MCP-ready)
- Weekly email digest
- Push notifications (PWA) for cross-device alerts
- Multi-user auth

---

Made for Vishwak. Personal use.

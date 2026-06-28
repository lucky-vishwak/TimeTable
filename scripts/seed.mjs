#!/usr/bin/env node
// ----------------------------------------------------------------------------
// seed.mjs — populate the DB with a couple weeks of realistic sample data so
// the dashboard, calendar and analytics have something to show.
//
//   node scripts/seed.mjs           # add sample data (keeps existing)
//   node scripts/seed.mjs --reset   # wipe tasks/food first, then seed
// ----------------------------------------------------------------------------

import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const txt = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim().replace(/^['"]|['"]$/g, "");
        process.env[m[1]] = v;
      }
    }
  } catch {}
}
loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set. Add it to .env.local");
  process.exit(1);
}

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const addDays = (d, n) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const chance = (p) => Math.random() < p;

await mongoose.connect(uri);
const db = mongoose.connection.db;
const Tasks = db.collection("tasks");
const Food = db.collection("foodlogs");
const Settings = db.collection("settings");
const LifeLogs = db.collection("lifelogs");

if (process.argv.includes("--reset")) {
  await Tasks.deleteMany({});
  await Food.deleteMany({});
  await LifeLogs.deleteMany({});
  console.log("Cleared tasks, food and life logs.");
}

// Ensure settings exist
const existing = await Settings.findOne({ key: "default" });
if (!existing) {
  await Settings.insertOne({
    key: "default",
    name: "Vishwak",
    officeStart: "09:30",
    officeEnd: "18:30",
    officeDays: [1, 2, 3, 4, 5],
    sleepStart: "23:30",
    wakeTime: "07:00",
    dailyFocusMinutesGoal: 90,
    dailyFocusTasksGoal: 2,
    mealSchedule: [
      { meal: "breakfast", time: "08:30" },
      { meal: "lunch", time: "13:00" },
      { meal: "dinner", time: "21:00" },
    ],
    reminders: [
      { enabled: true, label: "Plan your day", time: "08:00", message: "Good morning! Plan your tasks for today.", days: [1, 2, 3, 4, 5] },
      { enabled: true, label: "Focus time", time: "20:00", message: "Time for your daily focus tasks 🚀", days: [0, 1, 2, 3, 4, 5, 6] },
      { enabled: true, label: "Day review", time: "22:30", message: "Review your day & mark tasks done/missed.", days: [0, 1, 2, 3, 4, 5, 6] },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Created default settings.");
}

const focusTitles = [
  "LeetCode: 2 problems",
  "Build feature branch",
  "Learn: Rust basics",
  "Side project: auth flow",
  "Read system design article",
  "Course: 1 module",
  "Write blog post draft",
];
const officeTitles = [
  "Standup meeting",
  "Code review PRs",
  "Sprint task: ticket work",
  "1:1 with manager",
  "Design discussion",
];
const generalTitles = [
  "Gym workout",
  "Grocery shopping",
  "Call family",
  "Read 20 pages",
  "Evening walk",
];
const foods = {
  breakfast: [["Oats with fruit", true], ["Idli & sambar", true], ["Bread omelette", true], ["Leftover pizza", false]],
  lunch: [["Rice, dal, veggies", true], ["Chicken salad", true], ["Burger & fries", false], ["Biryani", false]],
  dinner: [["Roti & curry", true], ["Veg soup & salad", true], ["Maggi noodles", false], ["Fried rice", false]],
  snack: [["Apple", true], ["Almonds", true], ["Chips", false], ["Samosa", false]],
};

const lifeEvents = [
  ["movie", "Watched Dune: Part Two", "PVR Cinemas", ["friends"], "21:30"],
  ["party", "Dinner party at Arjun's", "Arjun's place", ["college gang"], "20:00"],
  ["outing", "Coffee & long walk", "Marina Beach", ["Sneha"], "17:30"],
  ["travel", "Weekend trip to Pondicherry", "Pondicherry", ["family"], "07:00"],
  ["event", "Tech meetup: React India", "Convention Center", [], "10:00"],
  ["health", "Doctor checkup", "Apollo Clinic", [], "11:00"],
  ["shopping", "Bought running shoes", "Phoenix Mall", [], "16:00"],
  ["movie", "Binge: new series finale", "Home", [], "22:00"],
];

const tasksToInsert = [];
const foodToInsert = [];
const lifeToInsert = [];
const today = new Date();

for (let i = 13; i >= 0; i--) {
  const d = addDays(today, -i);
  const key = dayKey(d);
  const wd = d.getDay();
  const isWorkday = wd >= 1 && wd <= 5;
  // Some "bad" days where lots gets missed
  const slackDay = chance(0.25);

  // Office tasks on workdays
  if (isWorkday) {
    const n = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < n; k++) {
      const start = 10 + k * 2;
      tasksToInsert.push({
        title: pick(officeTitles),
        notes: "",
        category: "office",
        date: key,
        startTime: `${String(start).padStart(2, "0")}:00`,
        endTime: `${String(start + 1).padStart(2, "0")}:30`,
        plannedMinutes: 90,
        actualMinutes: 90,
        status: slackDay && chance(0.4) ? "missed" : chance(0.85) ? "done" : "planned",
        priority: pick(["medium", "high", "low"]),
        tags: [],
        completedAt: null,
        createdAt: d,
        updatedAt: d,
      });
    }
  }

  // Focus tasks (productive / growth work)
  const focusN = 1 + Math.floor(Math.random() * 2);
  for (let k = 0; k < focusN; k++) {
    const done = slackDay ? chance(0.4) : chance(0.8);
    tasksToInsert.push({
      title: pick(focusTitles),
      notes: "",
      category: "focus",
      date: key,
      startTime: "20:00",
      endTime: "21:00",
      plannedMinutes: 60,
      actualMinutes: done ? pick([45, 60, 75, 90]) : 0,
      status: done ? "done" : chance(0.5) ? "missed" : "planned",
      priority: "high",
      tags: ["growth"],
      completedAt: done ? d : null,
      createdAt: d,
      updatedAt: d,
    });
  }

  // General task
  if (chance(0.7)) {
    const done = !slackDay && chance(0.7);
    tasksToInsert.push({
      title: pick(generalTitles),
      notes: "",
      category: "general",
      date: key,
      startTime: "18:00",
      endTime: "19:00",
      plannedMinutes: 60,
      actualMinutes: done ? 60 : 0,
      status: done ? "done" : "planned",
      priority: "low",
      tags: [],
      completedAt: done ? d : null,
      createdAt: d,
      updatedAt: d,
    });
  }

  // Food
  for (const meal of ["breakfast", "lunch", "dinner", "snack"]) {
    if (meal === "snack" && chance(0.5)) continue;
    if (slackDay && chance(0.4)) continue; // skip logging on slack days
    const [name, healthy] = pick(foods[meal]);
    foodToInsert.push({
      date: key,
      meal,
      name,
      time:
        meal === "breakfast" ? "08:30" : meal === "lunch" ? "13:00" : meal === "dinner" ? "21:00" : "17:00",
      calories: pick([200, 350, 450, 600]),
      healthy,
      notes: "",
      createdAt: d,
      updatedAt: d,
    });
  }

  // Life events / memories — a few per fortnight (mostly evenings/weekends)
  const wantEvent = !isWorkday ? chance(0.85) : chance(0.4);
  if (wantEvent) {
    const [type, title, location, people, time] = pick(lifeEvents);
    lifeToInsert.push({
      date: key,
      time,
      type,
      title,
      notes: "",
      people,
      location,
      rating: pick([0, 3, 4, 4, 5]),
      createdAt: d,
      updatedAt: d,
    });
  }
}

if (tasksToInsert.length) await Tasks.insertMany(tasksToInsert);
if (foodToInsert.length) await Food.insertMany(foodToInsert);
if (lifeToInsert.length) await LifeLogs.insertMany(lifeToInsert);

console.log(
  `Seeded ${tasksToInsert.length} tasks, ${foodToInsert.length} food logs and ${lifeToInsert.length} life events over 14 days.`
);
await mongoose.disconnect();
process.exit(0);

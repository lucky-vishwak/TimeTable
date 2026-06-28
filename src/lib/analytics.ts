import { TaskDTO, FoodLogDTO, SettingsDTO, Category } from "./types";
import { durationBetween, fromDayKey } from "./date";

export interface DayStat {
  date: string;
  weekday: number;
  total: number;
  done: number;
  missed: number;
  planned: number;
  skipped: number;
  completionRate: number; // 0..1 of non-skipped tasks
  plannedMinutes: number;
  actualMinutes: number;
  focusMinutes: number;
  focusTasksDone: number;
  meals: number;
  healthyMeals: number;
  score: number; // 0..100 adherence score
  onTrack: boolean;
}

export interface CategorySplit {
  category: Category;
  plannedMinutes: number;
  actualMinutes: number;
  done: number;
  total: number;
}

export interface Suggestion {
  id: string;
  severity: "good" | "info" | "warn" | "bad";
  title: string;
  detail: string;
}

export interface AnalyticsResult {
  range: { from: string; to: string };
  days: DayStat[];
  totals: {
    completionRate: number;
    avgScore: number;
    onTrackDays: number;
    offTrackDays: number;
    plannedMinutes: number;
    actualMinutes: number;
    focusMinutes: number;
    focusGoalHitDays: number;
  };
  categorySplit: CategorySplit[];
  bestDay?: DayStat;
  worstDay?: DayStat;
  suggestions: Suggestion[];
}

function taskMinutes(t: TaskDTO): number {
  if (t.actualMinutes && t.actualMinutes > 0) return t.actualMinutes;
  if (t.plannedMinutes && t.plannedMinutes > 0) return t.plannedMinutes;
  return durationBetween(t.startTime, t.endTime);
}

export function computeDayStat(
  date: string,
  tasks: TaskDTO[],
  food: FoodLogDTO[],
  settings: SettingsDTO
): DayStat {
  const weekday = fromDayKey(date).getDay();
  const dayTasks = tasks.filter((t) => t.date === date);
  const dayFood = food.filter((f) => f.date === date);

  const done = dayTasks.filter((t) => t.status === "done").length;
  const missed = dayTasks.filter((t) => t.status === "missed").length;
  const planned = dayTasks.filter((t) => t.status === "planned").length;
  const skipped = dayTasks.filter((t) => t.status === "skipped").length;
  const total = dayTasks.length;

  const considered = total - skipped;
  const completionRate = considered > 0 ? done / considered : 0;

  const plannedMinutes = dayTasks.reduce(
    (s, t) => s + (t.plannedMinutes || durationBetween(t.startTime, t.endTime)),
    0
  );
  const actualMinutes = dayTasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + taskMinutes(t), 0);

  const focusTasks = dayTasks.filter((t) => t.category === "focus");
  const focusDone = focusTasks.filter((t) => t.status === "done");
  const focusMinutes = focusDone.reduce((s, t) => s + taskMinutes(t), 0);
  const focusTasksDone = focusDone.length;

  const meals = dayFood.length;
  const healthyMeals = dayFood.filter((f) => f.healthy).length;

  // Adherence score: weighted blend of completion, focus goal, meal health.
  const focusGoalRatio = settings.dailyFocusMinutesGoal
    ? Math.min(1, focusMinutes / settings.dailyFocusMinutesGoal)
    : 0;
  const foodRatio = meals > 0 ? healthyMeals / meals : 0.5;

  let score = Math.round(
    completionRate * 60 + focusGoalRatio * 25 + foodRatio * 15
  );
  if (total === 0 && meals === 0) score = 0;
  score = Math.max(0, Math.min(100, score));

  return {
    date,
    weekday,
    total,
    done,
    missed,
    planned,
    skipped,
    completionRate,
    plannedMinutes,
    actualMinutes,
    focusMinutes,
    focusTasksDone,
    meals,
    healthyMeals,
    score,
    onTrack: score >= 70,
  };
}

export function buildAnalytics(
  from: string,
  to: string,
  tasks: TaskDTO[],
  food: FoodLogDTO[],
  settings: SettingsDTO
): AnalyticsResult {
  // Enumerate days in range.
  const days: DayStat[] = [];
  let cursor = fromDayKey(from);
  const end = fromDayKey(to);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(cursor.getDate()).padStart(2, "0")}`;
    days.push(computeDayStat(key, tasks, food, settings));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }

  // Only count "active" days (had tasks or meals) for averages.
  const activeDays = days.filter((d) => d.total > 0 || d.meals > 0);
  const onTrackDays = activeDays.filter((d) => d.onTrack).length;
  const offTrackDays = activeDays.length - onTrackDays;

  const sum = (sel: (d: DayStat) => number) =>
    activeDays.reduce((s, d) => s + sel(d), 0);

  const totalDoneConsidered = days.reduce(
    (s, d) => s + (d.total - d.skipped),
    0
  );
  const totalDone = days.reduce((s, d) => s + d.done, 0);

  const categorySplit: CategorySplit[] = (
    ["general", "focus", "food", "office"] as Category[]
  ).map((cat) => {
    const ct = tasks.filter((t) => t.category === cat);
    return {
      category: cat,
      plannedMinutes: ct.reduce(
        (s, t) =>
          s + (t.plannedMinutes || durationBetween(t.startTime, t.endTime)),
        0
      ),
      actualMinutes: ct
        .filter((t) => t.status === "done")
        .reduce((s, t) => s + taskMinutes(t), 0),
      done: ct.filter((t) => t.status === "done").length,
      total: ct.length,
    };
  });

  const sorted = [...activeDays].sort((a, b) => b.score - a.score);
  const bestDay = sorted[0];
  const worstDay = sorted[sorted.length - 1];

  const focusGoalHitDays = activeDays.filter(
    (d) => d.focusMinutes >= settings.dailyFocusMinutesGoal
  ).length;

  const totals = {
    completionRate: totalDoneConsidered > 0 ? totalDone / totalDoneConsidered : 0,
    avgScore: activeDays.length
      ? Math.round(sum((d) => d.score) / activeDays.length)
      : 0,
    onTrackDays,
    offTrackDays,
    plannedMinutes: sum((d) => d.plannedMinutes),
    actualMinutes: sum((d) => d.actualMinutes),
    focusMinutes: sum((d) => d.focusMinutes),
    focusGoalHitDays,
  };

  const suggestions = buildSuggestions(
    activeDays,
    totals,
    categorySplit,
    settings
  );

  return {
    range: { from, to },
    days,
    totals,
    categorySplit,
    bestDay,
    worstDay,
    suggestions,
  };
}

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function buildSuggestions(
  days: DayStat[],
  totals: AnalyticsResult["totals"],
  categorySplit: CategorySplit[],
  settings: SettingsDTO
): Suggestion[] {
  const out: Suggestion[] = [];
  if (days.length === 0) {
    out.push({
      id: "empty",
      severity: "info",
      title: "No data yet",
      detail: "Add some tasks and log meals to unlock personalized insights.",
    });
    return out;
  }

  // 1. Overall adherence
  if (totals.avgScore >= 80) {
    out.push({
      id: "great",
      severity: "good",
      title: "You're crushing it 🎯",
      detail: `Average daily score ${totals.avgScore}/100 across ${days.length} active days. Keep the streak going.`,
    });
  } else if (totals.avgScore < 55) {
    out.push({
      id: "low-score",
      severity: "bad",
      title: "Adherence is slipping",
      detail: `Average score is only ${totals.avgScore}/100. ${totals.offTrackDays} of ${days.length} days were off-track. Try planning fewer, higher-priority tasks per day.`,
    });
  }

  // 2. Which weekday is weakest
  const byWeekday: Record<number, { sum: number; n: number }> = {};
  days.forEach((d) => {
    byWeekday[d.weekday] = byWeekday[d.weekday] || { sum: 0, n: 0 };
    byWeekday[d.weekday].sum += d.score;
    byWeekday[d.weekday].n += 1;
  });
  const weekdayAvgs = Object.entries(byWeekday)
    .map(([wd, v]) => ({ wd: Number(wd), avg: v.sum / v.n, n: v.n }))
    .filter((x) => x.n >= 1)
    .sort((a, b) => a.avg - b.avg);
  if (weekdayAvgs.length >= 2 && weekdayAvgs[0].avg < 60) {
    out.push({
      id: "weak-weekday",
      severity: "warn",
      title: `${WEEKDAYS_LONG[weekdayAvgs[0].wd]}s are your weak spot`,
      detail: `Your ${WEEKDAYS_LONG[weekdayAvgs[0].wd]} average is ${Math.round(
        weekdayAvgs[0].avg
      )}/100 — the lowest of the week. Plan lighter or add a reminder that day.`,
    });
  }

  // 3. Focus goal
  const focusHitRate = days.length ? totals.focusGoalHitDays / days.length : 0;
  if (focusHitRate < 0.5) {
    out.push({
      id: "focus",
      severity: "warn",
      title: "Focus goal is being missed",
      detail: `You hit your ${settings.dailyFocusMinutesGoal}-min focus goal on only ${totals.focusGoalHitDays}/${days.length} days. Block a fixed slot (e.g. right after office) to protect it.`,
    });
  } else if (focusHitRate >= 0.8) {
    out.push({
      id: "focus-good",
      severity: "good",
      title: "Focus consistency 💪",
      detail: `Daily focus goal hit on ${totals.focusGoalHitDays}/${days.length} days. Strong habit.`,
    });
  }

  // 4. Office time crowding out everything else
  const office = categorySplit.find((c) => c.category === "office");
  const focus = categorySplit.find((c) => c.category === "focus");
  if (office && focus && office.actualMinutes > 0) {
    const officeH = Math.round(office.actualMinutes / 60);
    if (focus.actualMinutes < office.actualMinutes * 0.1 && officeH > 10) {
      out.push({
        id: "office-heavy",
        severity: "info",
        title: "Office hours dominate your time",
        detail: `~${officeH}h logged on office work vs only ${Math.round(
          focus.actualMinutes / 60
        )}h focus. Consider a 25-min focused focus sprint before work.`,
      });
    }
  }

  // 5. Food health
  const totalMeals = days.reduce((s, d) => s + d.meals, 0);
  const healthyMeals = days.reduce((s, d) => s + d.healthyMeals, 0);
  if (totalMeals >= 5) {
    const ratio = healthyMeals / totalMeals;
    if (ratio < 0.5) {
      out.push({
        id: "food",
        severity: "warn",
        title: "Eating could be healthier",
        detail: `Only ${Math.round(
          ratio * 100
        )}% of logged meals were marked healthy. Try prepping one healthy meal a day.`,
      });
    } else if (ratio >= 0.8) {
      out.push({
        id: "food-good",
        severity: "good",
        title: "Solid eating habits 🥗",
        detail: `${Math.round(ratio * 100)}% of your meals were healthy. Nice.`,
      });
    }
    const skippedMealDays = days.filter((d) => d.meals === 0).length;
    if (skippedMealDays >= Math.ceil(days.length * 0.3)) {
      out.push({
        id: "food-missing",
        severity: "info",
        title: "You're not logging meals consistently",
        detail: `${skippedMealDays} day(s) had no meals logged. Logging helps spot energy dips that hurt focus.`,
      });
    }
  }

  // 6. Planned vs actual time realism
  if (totals.plannedMinutes > 0) {
    const realism = totals.actualMinutes / totals.plannedMinutes;
    if (realism < 0.6) {
      out.push({
        id: "overplan",
        severity: "warn",
        title: "You're over-planning your days",
        detail: `You completed ~${Math.round(
          realism * 100
        )}% of planned time. Schedule fewer tasks so the plan stays believable and motivating.`,
      });
    }
  }

  // 7. Missed tasks pattern
  const totalMissed = days.reduce((s, d) => s + d.missed, 0);
  const totalTasks = days.reduce((s, d) => s + d.total, 0);
  if (totalTasks > 0 && totalMissed / totalTasks > 0.3) {
    out.push({
      id: "missed",
      severity: "bad",
      title: "Too many tasks slipping",
      detail: `${totalMissed}/${totalTasks} tasks were missed. Use priorities and tackle "high" priority items first thing.`,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "steady",
      severity: "info",
      title: "Steady going",
      detail: "Nothing alarming. Add more data for sharper insights.",
    });
  }
  return out;
}

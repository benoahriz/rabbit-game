// rabbit-game v0.2 — clock & calendar widgets (PRD UC-7, user direction 2026-10-24).
// Pure data builder is node-tested; renderMonth is a thin DOM wrapper.
// Local device time only — no network, no timezone fetching.

/**
 * Which garden variant the real hour calls for (IDEA-018): Casey's world
 * follows the player's day. 17:00–19:59 golden hour; 20:00–05:59 night
 * (runtime-derived scene + fireflies); otherwise day.
 */
export function sceneForHour(h) {
  if (h >= 20 || h < 6) return "night";
  if (h >= 17 && h < 20) return "sunset";
  return "day";
}

/**
 * Month grid for a given year/month (monthIdx 0–11), Sunday-start weeks.
 * Blank cells are null. Structural contract (tested):
 *   - every week has exactly 7 cells
 *   - the first non-null cell's index equals new Date(y, m, 1).getDay()
 *   - non-null cells are 1..daysInMonth, in order
 */
export function monthMatrix(year, monthIdx) {
  const first = new Date(year, monthIdx, 1);
  const days = new Date(year, monthIdx + 1, 0).getDate();
  const weeks = [];
  let week = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return {
    label: first.toLocaleString("en-US", { month: "long", year: "numeric" }),
    weeks,
  };
}

/**
 * Render one month into a container (replaces its children).
 * Today is circled only when the shown month is the current month.
 */
export function renderMonth(el, year, monthIdx, today = new Date()) {
  const { label, weeks } = monthMatrix(year, monthIdx);
  el.replaceChildren();
  for (const dow of ["S", "M", "T", "W", "T", "F", "S"]) {
    const d = document.createElement("div");
    d.className = "cal-dow";
    d.textContent = dow;
    el.appendChild(d);
  }
  const isThisMonth = today.getFullYear() === year && today.getMonth() === monthIdx;
  for (const week of weeks) {
    for (const day of week) {
      const cell = document.createElement("div");
      if (day === null) {
        cell.className = "cal-day blank";
      } else {
        cell.className = "cal-day";
        cell.textContent = String(day);
        if (isThisMonth && day === today.getDate()) cell.classList.add("today");
      }
      el.appendChild(cell);
    }
  }
  return label;
}

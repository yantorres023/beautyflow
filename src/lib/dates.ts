export const APP_TIMEZONE = "America/Sao_Paulo";

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_INPUT_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function getParts(value: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value).reduce<Record<string, string>>((parts, part) => {
    if (part.type !== "literal") parts[part.type] = part.value;
    return parts;
  }, {});
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isSameUtcDate(value: Date, year: number, month: number, day: number) {
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
}

export function formatDateTime(value: Date | string, timeZone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatDate(value: Date | string, timeZone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone,
  }).format(new Date(value));
}

export function formatDateOnly(value: Date | string) {
  const dateOnly = typeof value === "string" && DATE_INPUT_PATTERN.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(dateOnly);
}

export function getCurrentMonthRange(timeZone = APP_TIMEZONE) {
  const now = new Date();
  const parts = getParts(now, timeZone);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const firstDay = `${year}-${pad(month)}-01`;
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const nextMonthDay = `${nextMonth.getUTCFullYear()}-${pad(nextMonth.getUTCMonth() + 1)}-01`;

  return {
    from: localDateTimeToUtc(firstDay, "00:00", timeZone),
    to: localDateTimeToUtc(nextMonthDay, "00:00", timeZone),
  };
}

export function toDateInputValue(value: Date | string, timeZone = APP_TIMEZONE) {
  const parts = getParts(new Date(value), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function localDateTimeToUtc(date: string, time: string, timeZone = APP_TIMEZONE) {
  const dateMatch = DATE_INPUT_PATTERN.exec(date);
  const timeMatch = TIME_INPUT_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) return new Date(Number.NaN);

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? "0");
  if (hour > 23 || minute > 59 || second > 59) return new Date(Number.NaN);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (!isSameUtcDate(guess, year, month, day)) return new Date(Number.NaN);

  const localParts = getParts(guess, timeZone);
  const asUtc = Date.UTC(
    Number(localParts.year),
    Number(localParts.month) - 1,
    Number(localParts.day),
    Number(localParts.hour),
    Number(localParts.minute),
    Number(localParts.second),
  );
  const offsetMinutes = (asUtc - guess.getTime()) / 60_000;
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

export function formatTime(value: Date | string, timeZone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export function startOfLocalWeek(reference = new Date()) {
  return startOfLocalWeekInTimezone(reference, APP_TIMEZONE);
}

export function startOfLocalWeekInTimezone(reference: Date, timeZone = APP_TIMEZONE) {
  const dateKey = toDateInputValue(reference, timeZone);
  const match = DATE_INPUT_PATTERN.exec(dateKey);
  if (!match) return new Date(Number.NaN);

  const calendarDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const daysFromMonday = (calendarDate.getUTCDay() + 6) % 7;
  calendarDate.setUTCDate(calendarDate.getUTCDate() - daysFromMonday);
  const weekStart = `${calendarDate.getUTCFullYear()}-${pad(calendarDate.getUTCMonth() + 1)}-${pad(calendarDate.getUTCDate())}`;
  return localDateTimeToUtc(weekStart, "00:00", timeZone);
}

export function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return date;
}

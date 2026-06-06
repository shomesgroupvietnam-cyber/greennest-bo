const businessTimeZone = "Asia/Ho_Chi_Minh";
const dayMs = 86_400_000;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const businessDayUtcOffset = "+07:00";

function datePartsInBusinessTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: businessTimeZone,
    year: "numeric",
  }).formatToParts(date);

  return {
    day: Number(parts.find((part) => part.type === "day")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    year: Number(parts.find((part) => part.type === "year")?.value),
  };
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function isValidDateOnly(value: string) {
  const match = dateOnlyPattern.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function businessDateKey(date: Date = new Date()) {
  const parts = datePartsInBusinessTimeZone(date);

  if (!parts.year || !parts.month || !parts.day) {
    return undefined;
  }

  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

export function businessDateRangeStartIso(value: string) {
  return isValidDateOnly(value) ? new Date(`${value}T00:00:00.000${businessDayUtcOffset}`).toISOString() : undefined;
}

export function businessDateRangeEndIso(value: string) {
  return isValidDateOnly(value) ? new Date(`${value}T23:59:59.999${businessDayUtcOffset}`).toISOString() : undefined;
}

export function businessDayIndex(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const match = dateOnlyPattern.exec(value);

    if (match) {
      const [, year, month, day] = match;

      if (!isValidDateOnly(value)) {
        return undefined;
      }

      return Date.UTC(Number(year), Number(month) - 1, Number(day)) / dayMs;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const parts = datePartsInBusinessTimeZone(date);

  if (!parts.year || !parts.month || !parts.day) {
    return undefined;
  }

  return Date.UTC(parts.year, parts.month - 1, parts.day) / dayMs;
}

export function businessDaysBetween(target: Date | string | undefined, now: Date) {
  const targetDay = businessDayIndex(target);
  const nowDay = businessDayIndex(now);

  if (targetDay === undefined || nowDay === undefined) {
    return undefined;
  }

  return Math.round(nowDay - targetDay);
}

export function isBeforeBusinessDay(value: string | undefined, today: Date) {
  const valueDay = businessDayIndex(value);
  const todayDay = businessDayIndex(today);

  return valueDay !== undefined && todayDay !== undefined && valueDay < todayDay;
}

export function isSameBusinessDay(value: string | undefined, today: Date) {
  const valueDay = businessDayIndex(value);
  const todayDay = businessDayIndex(today);

  return valueDay !== undefined && todayDay !== undefined && valueDay === todayDay;
}

export function isDueOnOrBeforeBusinessDay(value: string | undefined, today: Date) {
  const valueDay = businessDayIndex(value);
  const todayDay = businessDayIndex(today);

  return valueDay !== undefined && todayDay !== undefined && valueDay <= todayDay;
}

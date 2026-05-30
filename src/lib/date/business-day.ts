const businessTimeZone = "Asia/Ho_Chi_Minh";
const dayMs = 86_400_000;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

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

export function businessDayIndex(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const match = dateOnlyPattern.exec(value);

    if (match) {
      const [, year, month, day] = match;

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

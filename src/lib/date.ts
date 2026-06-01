export function formatCurrentMonth(locale = "pt-BR") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function formatDate(dateString: string, locale = "pt-BR", short = false) {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const localDate =
    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
      ? new Date(year, month - 1, day)
      : new Date(dateString);

  if (short) {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(localDate);
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(localDate);
}

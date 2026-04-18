/**
 * @param {number} days - number of days from today (must be >= 1)
 * @param {Date} [from] - reference date, defaults to today
 * @returns {string}
 */
export function relativeDay(days, from = new Date()) {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  if (days === 1) return 'tomorrow';
  if (days === 2) return 'the day after tomorrow';
  if (days <= 6)  return `in ${days} days`;

  if (days <= 13) {
    const target = new Date(from);
    target.setDate(target.getDate() + days);
    return `next ${DAYS[target.getDay()]}`;
  }

  if (days === 14) return 'in two weeks';

  return `in ${days} days`;
}

import dayjs from 'dayjs';

/**
 * Formats a date-time string or Date object into a more readable format.
 * @param dateTime The date-time string (ISO 8601, etc.) or Date object to format.
 * @param formatString The desired output format (e.g., 'YYYY-MM-DD HH:mm:ss'). Defaults to 'YYYY-MM-DD HH:mm:ss'.
 * @returns The formatted date-time string, or an empty string if the input is invalid or null.
 */
export function formatDateTime(
  dateTime: string | Date | undefined | null,
  formatString: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!dateTime) {
    return '-'; // Or an empty string: '', depending on preference for empty dates
  }
  const date = dayjs(dateTime);
  if (!date.isValid()) {
    return '-'; // Or handle invalid date string appropriately
  }
  return date.format(formatString);
}

/**
 * Formats a date string or Date object into a date-only format.
 * @param dateValue The date string (ISO 8601, etc.) or Date object to format.
 * @param formatString The desired output format (e.g., 'YYYY-MM-DD'). Defaults to 'YYYY-MM-DD'.
 * @returns The formatted date string, or an empty string if the input is invalid or null.
 */
export function formatDate(
  dateValue: string | Date | undefined | null,
  formatString: string = 'YYYY-MM-DD'
): string {
  if (!dateValue) {
    return '-';
  }
  const date = dayjs(dateValue);
  if (!date.isValid()) {
    return '-';
  }
  return date.format(formatString);
}

// You can add more date utility functions here as needed, for example:
// - calculateDuration
// - timeAgo
// - isDateBefore/After 
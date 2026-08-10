import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a "HH:mm" / "HH:mm:ss" clock string as 12-hour time, e.g. "14:00:00" -> "2:00 PM".
 * Returns the input unchanged when it isn't a recognisable clock string.
 */
export function formatClockTime12h(time: string | null | undefined): string {
  if (!time) return ""
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim())
  if (!match) return time
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return time
  const period = hours < 12 ? "AM" : "PM"
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${match[2]} ${period}`
}

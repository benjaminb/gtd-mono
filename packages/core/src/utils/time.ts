/**
 * Format seconds into a human-readable time string
 * Examples:
 * - 45 seconds -> "45s"
 * - 90 seconds -> "1m 30s"
 * - 3665 seconds -> "1h 1m"
 * - 7200 seconds -> "2h"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  // Only show seconds if less than 1 hour
  if (hours === 0 && seconds > 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}

/**
 * Format seconds into a detailed time string
 * Examples:
 * - 45 seconds -> "45 seconds"
 * - 90 seconds -> "1 minute 30 seconds"
 * - 3665 seconds -> "1 hour 1 minute 5 seconds"
 */
export function formatDurationDetailed(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  if (seconds > 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Calculate total seconds including current session if tracking
 */
export function calculateTotalSeconds(
  timeTracking: {
    totalSeconds: number;
    currentSessionStart: string | null;
  }
): number {
  let total = timeTracking.totalSeconds || 0;

  if (timeTracking.currentSessionStart) {
    const startTime = new Date(timeTracking.currentSessionStart);
    const now = new Date();
    const currentSessionSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    total += currentSessionSeconds;
  }

  return total;
}

/**
 * Format a date to a readable string
 * Examples:
 * - Today -> "Today"
 * - Yesterday -> "Yesterday"
 * - This week -> "Monday", "Tuesday", etc.
 * - Older -> "Jan 15", "Dec 25, 2023"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return 'Today';
  }

  if (daysDiff === 1) {
    return 'Yesterday';
  }

  if (daysDiff < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  const isSameYear = date.getFullYear() === now.getFullYear();

  if (isSameYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a timestamp to time string
 * Examples:
 * - "2:45 PM"
 * - "10:30 AM"
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

import type { Task } from '../types';

/**
 * Fuzzy matching algorithm that checks if all characters in the query
 * appear in order in the target string (case-insensitive)
 */
export function fuzzyMatch(target: string, query: string): boolean {
  if (!target || !query) return false;

  const targetLower = target.toLowerCase();
  const queryLower = query.toLowerCase();

  let queryIndex = 0;

  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
}

/**
 * Score a task match based on relevance
 * Higher scores = better matches
 */
export function scoreTaskMatch(task: Task, query: string): number {
  const nameLower = task.name.toLowerCase();
  const queryLower = query.toLowerCase();

  let score = 0;

  // Exact match gets highest score
  if (nameLower === queryLower) {
    score += 1000;
  }

  // Starts with query gets high score
  if (nameLower.startsWith(queryLower)) {
    score += 500;
  }

  // Contains query as substring gets medium score
  if (nameLower.includes(queryLower)) {
    score += 250;
  }

  // Fuzzy match gets base score
  if (fuzzyMatch(task.name, query)) {
    score += 100;
  }

  // Bonus for shorter names (more focused match)
  score += Math.max(0, 100 - task.name.length);

  // Bonus for incomplete tasks (usually more relevant)
  if (!task.done) {
    score += 50;
  }

  return score;
}

/**
 * Check if a query is probably a property name
 * Returns { match: boolean, propertyName?: string }
 */
export function isProbablyPropertyName(
  query: string,
  knownPropertyNames: string[]
): { match: boolean; propertyName?: string } {
  const queryLower = query.toLowerCase();

  // Exact match
  for (const propName of knownPropertyNames) {
    if (propName.toLowerCase() === queryLower) {
      return { match: true, propertyName: propName };
    }
  }

  // Fuzzy match - only if there's a strong match
  for (const propName of knownPropertyNames) {
    if (fuzzyMatch(propName, query)) {
      // Require at least 70% of the property name to match
      const matchRatio = query.length / propName.length;
      if (matchRatio >= 0.7) {
        return { match: true, propertyName: propName };
      }
    }
  }

  return { match: false };
}

/**
 * Parse a property:value query
 * Returns null if not a valid property query format
 */
export function parsePropertyQuery(
  query: string
): { propertyName: string; propertyValue: string } | null {
  const colonIndex = query.indexOf(':');

  if (colonIndex === -1 || colonIndex === 0 || colonIndex === query.length - 1) {
    return null;
  }

  const propertyName = query.substring(0, colonIndex).trim();
  const propertyValue = query.substring(colonIndex + 1).trim();

  if (!propertyName || !propertyValue) {
    return null;
  }

  return { propertyName, propertyValue };
}

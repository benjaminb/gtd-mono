/**
 * Calculate Levenshtein distance between two strings
 * (measures how many single-character edits are needed)
 */
export function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Fuzzy match - returns true if strings are similar enough
 * Allows typos based on string length
 */
export function fuzzyMatch(str1, str2, threshold = null) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact substring match always passes
  if (s1.includes(s2) || s2.includes(s1)) {
    return true;
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  // Default threshold: allow 1 typo per 4 characters
  const maxDistance = threshold !== null ? threshold : Math.max(1, Math.floor(maxLength / 4));

  return distance <= maxDistance;
}

/**
 * Check if search query is likely a property name
 */
export function isProbablyPropertyName(query, allPropertyNames) {
  const q = query.toLowerCase().trim();

  // Exact match
  if (allPropertyNames.some(prop => prop.toLowerCase() === q)) {
    return { match: true, propertyName: allPropertyNames.find(p => p.toLowerCase() === q) };
  }

  // Fuzzy match property names
  for (const propName of allPropertyNames) {
    if (fuzzyMatch(propName, q, 2)) {
      return { match: true, propertyName: propName };
    }
  }

  return { match: false };
}

/**
 * Parse search query to detect property:value patterns
 * Examples: "priority:high", "tags:urgent", "status:done"
 */
export function parsePropertyQuery(query) {
  const colonIndex = query.indexOf(':');

  if (colonIndex === -1) {
    return null;
  }

  const propertyName = query.substring(0, colonIndex).trim();
  const propertyValue = query.substring(colonIndex + 1).trim();

  if (!propertyName || !propertyValue) {
    return null;
  }

  return { propertyName, propertyValue };
}

/**
 * Score a task match for relevance
 */
export function scoreTaskMatch(task, query) {
  const q = query.toLowerCase();
  const name = task.name.toLowerCase();

  // Exact match = highest score
  if (name === q) return 100;

  // Starts with query = high score
  if (name.startsWith(q)) return 90;

  // Contains query = medium score
  if (name.includes(q)) return 70;

  // Fuzzy match = lower score
  const distance = levenshteinDistance(name, q);
  const maxLength = Math.max(name.length, q.length);
  const similarity = 1 - (distance / maxLength);

  return similarity * 50;
}

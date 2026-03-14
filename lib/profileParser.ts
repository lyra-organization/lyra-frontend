export interface LyraProfile {
  summary: string;
  big_five: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  values: string[];
  interests: string[];
  energy_pattern: string;
  communication_style: string;
  relationship_style: string;
  compatibility_notes: string;
  keywords: string[];
}

/**
 * Checks if the assistant's message contains a <profile> tag,
 * indicating the interview is complete.
 */
export function containsProfile(text: string): boolean {
  return text.includes('<profile>') && text.includes('</profile>');
}

/**
 * Extracts and parses the JSON profile from between <profile> tags.
 */
export function parseProfile(text: string): LyraProfile | null {
  const match = text.match(/<profile>([\s\S]*?)<\/profile>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1].trim()) as LyraProfile;
  } catch {
    return null;
  }
}

/**
 * Converts a structured profile into a string for embedding.
 * Sends the raw JSON rather than a natural language paragraph.
 */
export function profileToText(profile: LyraProfile): string {
  return JSON.stringify(profile);
}

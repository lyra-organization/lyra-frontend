import { supabase } from './supabase';
import { LyraProfile, profileToText } from './profileParser';
import { Message } from './interview';

/**
 * Calls the /embed edge function to get a 512-dim personality fingerprint.
 */
async function getEmbedding(text: string): Promise<number[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/embed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ input: text }),
    },
  );

  if (!response.ok) {
    throw new Error(`Embed request failed: ${response.status}`);
  }

  const result = await response.json();
  return result.embedding;
}

/**
 * Saves the full profile to the profiles table:
 * - transcript (chat history)
 * - summary (Claude's description)
 * - traits (Big Five, values, interests, etc.)
 * - embedding (512-number fingerprint)
 */
export async function saveProfile(
  userId: string,
  profile: LyraProfile,
  transcript: Message[],
): Promise<void> {
  const text = profileToText(profile);
  const embedding = await getEmbedding(text);

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      transcript,
      summary: profile.summary,
      traits: {
        big_five: profile.big_five,
        values: profile.values,
        interests: profile.interests,
        energy_pattern: profile.energy_pattern,
        communication_style: profile.communication_style,
        relationship_style: profile.relationship_style,
        compatibility_notes: profile.compatibility_notes,
        keywords: profile.keywords,
      },
      embedding,
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

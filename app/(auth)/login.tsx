import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (loading) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Missing Email', 'Please enter your email.');
      return;
    }
    setLoading(true);

    try {
      // Dev shortcut: use a deterministic password so we can sign up / sign in
      // with just an email. Will be replaced with OTP later.
      const devPassword = `${trimmed}_lyra_dev_2026`;

      // Try signing in first (returning user)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password: devPassword,
      });

      if (!signInError) {
        // Existing user — ensure users row exists
        const { data: { user: existingUser } } = await supabase.auth.getUser();
        if (existingUser) {
          await supabase
            .from('users')
            .upsert(
              { auth_id: existingUser.id, name: 'User' },
              { onConflict: 'auth_id' },
            );
        }
        router.replace('/(app)/signup');
        return;
      }

      // New user — sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmed,
        password: devPassword,
      });
      if (signUpError) throw signUpError;

      const authUser = data.user;
      if (!authUser) throw new Error('Sign up succeeded but no user returned');

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(
          { auth_id: authUser.id, name: 'User' },
          { onConflict: 'auth_id' },
        );
      if (upsertError) throw upsertError;

      router.replace('/(app)/signup');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Lyra</Text>
        <Text style={styles.subtitle}>Find your person</Text>
      </View>

      <View style={styles.bottom}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666666"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={[styles.continueButton, loading && { opacity: 0.5 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Please wait...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});

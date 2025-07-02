import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailScreen() {
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      
      // Get current user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        Alert.alert('Error', 'No email found. Please try signing up again.');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      Alert.alert('Email Sent', 'A new verification email has been sent to your inbox.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={64} color="#14B8A6" />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to your email address. Please click the link to verify your account and complete your registration.
        </Text>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Next steps:</Text>
          <Text style={styles.instructionText}>1. Check your email inbox</Text>
          <Text style={styles.instructionText}>2. Click the verification link</Text>
          <Text style={styles.instructionText}>3. Return to the app to continue</Text>
        </View>

        <TouchableOpacity
          style={[styles.resendButton, resending && styles.disabledButton]}
          onPress={handleResendEmail}
          disabled={resending}
        >
          <RefreshCw size={20} color="#14B8A6" />
          <Text style={styles.resendButtonText}>
            {resending ? 'Sending...' : 'Resend email'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Didn't receive the email? Check your spam folder or try resending.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    position: 'absolute',
    backgroundColor: '#14B8A6',
    borderRadius: 50,
    top: 50,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#f0fdfa',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  instructions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#14B8A6',
    marginBottom: 24,
  },
  resendButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#14B8A6',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
  },
});
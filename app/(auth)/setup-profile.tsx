import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { CircleCheck as CheckCircle } from 'lucide-react-native';

export default function SetupProfileScreen() {
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      // In a real app, you might want to create additional profile data here
      // For now, we'll just navigate to the main app
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <CheckCircle size={48} color="#10B981" />
            </View>
            <Text style={styles.title}>Welcome to Ask Your OT!</Text>
            <Text style={styles.subtitle}>
              Your account has been created successfully. You can now start connecting with healthcare professionals or clients.
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureTitle}>✨ Personalized Experience</Text>
              <Text style={styles.featureDescription}>
                Complete your profile to get the most relevant matches and recommendations.
              </Text>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureTitle}>🔒 Secure & Private</Text>
              <Text style={styles.featureDescription}>
                Your information is protected with industry-standard security measures.
              </Text>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureTitle}>📱 Easy Communication</Text>
              <Text style={styles.featureDescription}>
                Chat with professionals, book appointments, and track your progress all in one place.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.disabledButton]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Setting up...' : 'Continue to App'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  successIcon: {
    marginBottom: 24,
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
  },
  features: {
    gap: 24,
    marginBottom: 48,
  },
  feature: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
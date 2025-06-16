import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexPage() {
  const { session, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session && userProfile) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    }
  }, [session, userProfile, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#14B8A6" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
});
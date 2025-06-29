import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Calendar, MessageCircle, TrendingUp, Heart, Clock, Users, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    unreadMessages: 0,
    progressEntries: 0,
    totalClients: 0,
  });

  const isTherapist = userProfile?.role === 'therapist';

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    if (!userProfile) return;

    try {
      // Load upcoming appointments
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq(isTherapist ? 'therapist_id' : 'client_id', userProfile.id)
        .eq('status', 'booked')
        .gte('scheduled_at', new Date().toISOString());

      // Load unread messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userProfile.id)
        .eq('read', false);

      setStats(prev => ({
        ...prev,
        upcomingAppointments: appointmentCount || 0,
        unreadMessages: messageCount || 0,
      }));

      if (isTherapist) {
        // Load client count for therapists
        const { count: clientCount } = await supabase
          .from('appointments')
          .select('client_id', { count: 'exact', head: true })
          .eq('therapist_id', userProfile.id);

        setStats(prev => ({ ...prev, totalClients: clientCount || 0 }));
      } else {
        // Load progress entries for clients
        const { count: progressCount } = await supabase
          .from('progress_logs')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', userProfile.id);

        setStats(prev => ({ ...prev, progressEntries: progressCount || 0 }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'find-therapist':
        router.push('/(tabs)/search');
        break;
      case 'appointments':
        router.push('/(tabs)/appointments');
        break;
      case 'log-progress':
        router.push('./(tabs)/progress');
        break;
      case 'messages':
        router.push('./(tabs)/messages');
        break;
      case 'schedule':
        router.push('./(tabs)/schedule');
        break;
      case 'progress-reviews':
        router.push('./(tabs)/progress');
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#14B8A6']} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{userProfile?.name || 'User'}</Text>
          <Text style={styles.subtitle}>
            {isTherapist ? 'Ready to help your clients today?' : 'How are you feeling today?'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Calendar size={24} color="#14B8A6" />
            </View>
            <Text style={styles.statNumber}>{stats.upcomingAppointments}</Text>
            <Text style={styles.statLabel}>Upcoming Appointments</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MessageCircle size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats.unreadMessages}</Text>
            <Text style={styles.statLabel}>Unread Messages</Text>
          </View>

          {isTherapist ? (
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Users size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{stats.totalClients}</Text>
              <Text style={styles.statLabel}>Total Clients</Text>
            </View>
          ) : (
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{stats.progressEntries}</Text>
              <Text style={styles.statLabel}>Progress Entries</Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {isTherapist ? (
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionCard, styles.scheduleCard]}
                onPress={() => handleQuickAction('schedule')}
                activeOpacity={0.8}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, styles.scheduleIcon]}>
                    <Calendar size={24} color="#ffffff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Manage Schedule</Text>
                    <Text style={styles.actionDescription}>Set your availability</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionCard, styles.messagesCard]}
                onPress={() => handleQuickAction('messages')}
                activeOpacity={0.8}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, styles.messagesIcon]}>
                    <MessageCircle size={24} color="#ffffff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Client Messages</Text>
                    <Text style={styles.actionDescription}>Respond to clients</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionCard, styles.progressCard]}
                onPress={() => handleQuickAction('progress-reviews')}
                activeOpacity={0.8}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, styles.progressIcon]}>
                    <TrendingUp size={24} color="#ffffff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Progress Reviews</Text>
                    <Text style={styles.actionDescription}>Check client progress</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionCard, styles.findTherapistCard]}
                onPress={() => handleQuickAction('find-therapist')}
                activeOpacity={0.8}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, styles.findTherapistIcon]}>
                    <Heart size={24} color="#ffffff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Find Therapist</Text>
                    <Text style={styles.actionDescription}>Book a session</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>

              {/* <TouchableOpacity 
                style={[styles.actionCard, styles.logProgressCard]}
                onPress={() => handleQuickAction('log-progress')}
                activeOpacity={0.8}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, styles.logProgressIcon]}>
                    <TrendingUp size={24} color="#ffffff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Log Progress</Text>
                    <Text style={styles.actionDescription}>Track your journey</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity> */}

              <TouchableOpacity 
                style={[styles.actionCard, styles.appointmentsCard]}
                onPress={() => handleQuickAction('appointments')}
                activeOpacity={0.8}
              >
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, styles.appointmentsIcon]}>
                    <Clock size={24} color="#ffffff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Appointments</Text>
                    <Text style={styles.actionDescription}>View schedule</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              {isTherapist 
                ? 'No recent client activity. Check back later.' 
                : 'Welcome to Ask Your OT! Start by finding a therapist that suits your needs.'}
            </Text>
          </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionGrid: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  actionDescription: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  
  // Individual card colors
  findTherapistCard: {
    backgroundColor: '#14B8A6',
  },
  findTherapistIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  logProgressCard: {
    backgroundColor: '#10B981',
  },
  logProgressIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  appointmentsCard: {
    backgroundColor: '#3B82F6',
  },
  appointmentsIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  
  // Therapist card colors
  scheduleCard: {
    backgroundColor: '#8B5CF6',
  },
  scheduleIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  messagesCard: {
    backgroundColor: '#06B6D4',
  },
  messagesIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressCard: {
    backgroundColor: '#F59E0B',
  },
  progressIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  recentActivity: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
  },
});
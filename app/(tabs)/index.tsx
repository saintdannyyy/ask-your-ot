import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Calendar, MessageCircle, TrendingUp, Heart, Clock, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { userProfile } = useAuth();
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
              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <Calendar size={24} color="#ffffff" />
                </View>
                <Text style={styles.actionTitle}>Manage Schedule</Text>
                <Text style={styles.actionDescription}>Set your availability</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <MessageCircle size={24} color="#ffffff" />
                </View>
                <Text style={styles.actionTitle}>Client Messages</Text>
                <Text style={styles.actionDescription}>Respond to clients</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <TrendingUp size={24} color="#ffffff" />
                </View>
                <Text style={styles.actionTitle}>Progress Reviews</Text>
                <Text style={styles.actionDescription}>Check client progress</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <Heart size={24} color="#ffffff" />
                </View>
                <Text style={styles.actionTitle}>Find Therapist</Text>
                <Text style={styles.actionDescription}>Book a session</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <TrendingUp size={24} color="#ffffff" />
                </View>
                <Text style={styles.actionTitle}>Log Progress</Text>
                <Text style={styles.actionDescription}>Track your journey</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <Clock size={24} color="#ffffff" />
                </View>
                <Text style={styles.actionTitle}>Appointments</Text>
                <Text style={styles.actionDescription}>View schedule</Text>
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
    backgroundColor: '#14B8A6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
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
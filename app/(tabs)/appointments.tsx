import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Calendar, Clock, User, Video, Phone, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client: Database['public']['Tables']['users']['Row'];
  therapist: Database['public']['Tables']['users']['Row'];
};

export default function AppointmentsScreen() {
  const { userProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  const isTherapist = userProfile?.role === 'therapist';

  useEffect(() => {
    loadAppointments();
  }, [userProfile, selectedFilter]);

  const loadAppointments = async () => {
    if (!userProfile) return;

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:client_id (*),
          therapist:therapist_id (*)
        `)
        .eq(isTherapist ? 'therapist_id' : 'client_id', userProfile.id)
        .order('scheduled_at', { ascending: true });

      if (selectedFilter === 'upcoming') {
        query = query.gte('scheduled_at', new Date().toISOString()).eq('status', 'booked');
      } else if (selectedFilter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return '#14B8A6';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'no_show':
        return '#F59E0B';
      default:
        return '#64748b';
    }
  };

  const handleAppointmentAction = (appointmentId: string, action: string) => {
    Alert.alert('Action', `${action} functionality will be implemented in the next update!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>
          {isTherapist ? 'Manage your client sessions' : 'Your upcoming sessions'}
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'upcoming' && styles.activeFilter]}
              onPress={() => setSelectedFilter('upcoming')}
            >
              <Text style={[styles.filterText, selectedFilter === 'upcoming' && styles.activeFilterText]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'completed' && styles.activeFilter]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text style={[styles.filterText, selectedFilter === 'completed' && styles.activeFilterText]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'all' && styles.activeFilter]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.appointmentsList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#14B8A6']} />}
      >
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'upcoming' 
                ? isTherapist 
                  ? 'No upcoming appointments with clients.' 
                  : 'No upcoming appointments. Book a session with a therapist.'
                : 'No appointments in this category.'}
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentsContainer}>
            {appointments.map((appointment) => {
              const otherUser = isTherapist ? appointment.client : appointment.therapist;
              return (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {otherUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{otherUser.name}</Text>
                        <Text style={styles.userRole}>
                          {isTherapist ? 'Client' : 'Therapist'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                      <Text style={styles.statusText}>{appointment.status}</Text>
                    </View>
                  </View>

                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#64748b" />
                      <Text style={styles.detailText}>{formatDate(appointment.scheduled_at)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={16} color="#64748b" />
                      <Text style={styles.detailText}>
                        {formatTime(appointment.scheduled_at)} ({appointment.duration} min)
                      </Text>
                    </View>
                  </View>

                  {appointment.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{appointment.notes}</Text>
                    </View>
                  )}

                  <View style={styles.appointmentActions}>
                    {appointment.status === 'booked' && (
                      <>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleAppointmentAction(appointment.id, 'Message')}
                        >
                          <MessageCircle size={16} color="#14B8A6" />
                          <Text style={styles.actionButtonText}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleAppointmentAction(appointment.id, 'Join Call')}
                        >
                          <Video size={16} color="#14B8A6" />
                          <Text style={styles.actionButtonText}>Join Call</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {appointment.status === 'completed' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleAppointmentAction(appointment.id, 'View Summary')}
                      >
                        <Text style={styles.actionButtonText}>View Summary</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
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
  filterContainer: {
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  filterButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilter: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  appointmentsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  appointmentsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  notesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#14B8A6',
  },
});
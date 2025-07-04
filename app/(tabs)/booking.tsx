import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, CheckCircle, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type TimeSlot = {
  time: string;
  available: boolean;
};

type TherapistData = {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[];
  credentials: string;
  experience_years: number;
  hourly_rate: string;
  is_approved: boolean;
  users: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
    location: string | null;
    phone: string | null;
  } | null;
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [therapist, setTherapist] = useState<TherapistData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const timeSlots: TimeSlot[] = [
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: false },
    { time: '12:00', available: true },
    { time: '13:00', available: false },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: false },
  ];

  const durations = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
  ];

  useEffect(() => {
    if (id) {
      loadTherapist();
    }
  }, [id]);

  const loadTherapist = async () => {
    try {
      console.log('🔍 Loading therapist with ID:', id);
      
      // Fetch therapist profile with user data
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          users (
            id,
            name,
            email,
            photo_url,
            location,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (therapistError) {
        console.error('❌ Therapist fetch error:', therapistError);
        Alert.alert('Error', 'Therapist not found');
        router.back();
        return;
      }

      console.log('✅ Therapist data loaded:', {
        id: therapistData.id,
        name: therapistData.users?.name,
        credentials: therapistData.credentials,
        hourly_rate: therapistData.hourly_rate
      });

      setTherapist(therapistData);
    } catch (error) {
      console.error('💥 Error loading therapist:', error);
      Alert.alert('Error', 'Failed to load therapist data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    console.log('🚀 === APPOINTMENT BOOKING STARTED ===');
    
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('Error', 'Please sign in to book an appointment');
      return;
    }

    if (!therapist) {
      Alert.alert('Error', 'Therapist data not available');
      return;
    }

    setBooking(true);
    
    try {
      // Create appointment datetime
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log('📅 Booking details:', {
        clientId: userProfile.id,
        therapistId: therapist.user_id,
        scheduledAt: appointmentDateTime.toISOString(),
        duration: duration,
        notes: notes
      });

      // Insert appointment into database
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: userProfile.id,
          therapist_id: therapist.user_id,
          scheduled_at: appointmentDateTime.toISOString(),
          duration: duration,
          status: 'booked',
          notes: notes || null,
          meeting_link: null,
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('❌ Appointment booking error:', appointmentError);
        throw new Error(`Booking failed: ${appointmentError.message}`);
      }

      console.log('✅ Appointment booked successfully:', appointmentData);

      // Show success message
      Alert.alert(
        'Success!', 
        `Your appointment with ${therapist.users?.name} has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}. You will receive a confirmation shortly.`,
        [
          {
            text: 'View Appointments',
            onPress: () => router.push('/(tabs)/appointments')
          },
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error: any) {
      console.error('💥 Booking error:', error);
      Alert.alert(
        'Booking Failed', 
        error.message || 'Failed to book appointment. Please try again.',
        [
          { text: 'Retry', onPress: () => handleBookAppointment() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setBooking(false);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!therapist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Therapist not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Therapist Info */}
        <View style={styles.therapistCard}>
          <View style={styles.therapistInfo}>
            {therapist.users?.photo_url ? (
              <Image source={{ uri: therapist.users.photo_url }} style={styles.therapistImage} />
            ) : (
              <View style={styles.therapistImagePlaceholder}>
                <Camera size={24} color="#64748b" />
              </View>
            )}
            <View style={styles.therapistDetails}>
              <Text style={styles.therapistName}>
                {therapist.users?.name || 'Licensed Therapist'}
              </Text>
              <Text style={styles.therapistCredentials}>{therapist.credentials}</Text>
              <Text style={styles.therapistRate}>₵{therapist.hourly_rate}/hour</Text>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#14B8A6" />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            <View style={styles.dateContainer}>
              {generateDateOptions().map((date, index) => {
                const dateInfo = formatDate(date);
                const isSelected = selectedDate.toDateString() === date.toDateString();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDateText]}>
                      {dateInfo.day}
                    </Text>
                    <Text style={[styles.dateNumber, isSelected && styles.selectedDateText]}>
                      {dateInfo.date}
                    </Text>
                    <Text style={[styles.monthText, isSelected && styles.selectedDateText]}>
                      {dateInfo.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#14B8A6" />
            <Text style={styles.sectionTitle}>Select Time</Text>
          </View>
          
          <View style={styles.timeGrid}>
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.disabledTimeSlot,
                  selectedTime === slot.time && styles.selectedTimeSlot
                ]}
                onPress={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
              >
                <Text style={[
                  styles.timeText,
                  !slot.available && styles.disabledTimeText,
                  selectedTime === slot.time && styles.selectedTimeText
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#14B8A6" />
            <Text style={styles.sectionTitle}>Session Duration</Text>
          </View>
          
          <View style={styles.durationContainer}>
            {durations.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationOption,
                  duration === option.value && styles.selectedDuration
                ]}
                onPress={() => setDuration(option.value)}
              >
                <Text style={[
                  styles.durationText,
                  duration === option.value && styles.selectedDurationText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#14B8A6" />
            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          </View>
          
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Tell your therapist about your specific needs, concerns, or goals for this session..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Therapist:</Text>
            <Text style={styles.summaryValue}>
              {therapist.users?.name || 'Licensed Therapist'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>{duration} minutes</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate:</Text>
            <Text style={styles.summaryValue}>₵{therapist.hourly_rate}/hour</Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bookButton, (!selectedTime || booking) && styles.disabledButton]}
          onPress={handleBookAppointment}
          disabled={!selectedTime || booking}
        >
          <LinearGradient
            colors={['#14B8A6', '#0d9488']}
            style={styles.bookButtonGradient}
          >
            {booking ? (
              <Text style={styles.bookButtonText}>Booking...</Text>
            ) : (
              <>
                <CheckCircle size={20} color="#ffffff" />
                <Text style={styles.bookButtonText}>Confirm Booking</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  therapistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  therapistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  therapistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  therapistImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  therapistDetails: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  therapistCredentials: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  therapistRate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#14B8A6',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  dateScroll: {
    marginHorizontal: -20,
  },
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  dateCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    minWidth: 60,
  },
  selectedDateCard: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  monthText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedDateText: {
    color: '#ffffff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  disabledTimeSlot: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  selectedTimeText: {
    color: '#ffffff',
  },
  disabledTimeText: {
    color: '#94a3b8',
  },
  durationContainer: {
    gap: 12,
  },
  durationOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  selectedDuration: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedDurationText: {
    color: '#ffffff',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  bottomActions: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
});
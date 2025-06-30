import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, CreditCard, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type TimeSlot = {
  time: string;
  available: boolean;
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [therapist, setTherapist] = useState<any>(null);
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
    loadTherapist();
  }, [id]);

  const loadTherapist = async () => {
    try {
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select('*, users(name, photo_url)')
        .eq('id', id)
        .single();

      if (therapistError) {
        Alert.alert('Error', 'Therapist not found');
        router.back();
        return;
      }

      setTherapist(therapistData);
    } catch (error) {
      console.error('Error loading therapist:', error);
      Alert.alert('Error', 'Failed to load therapist data');
      router.back();
    } finally {
      setLoading(false);
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

  const calculateTotal = () => {
    if (!therapist) return 0;
    const hourlyRate = parseFloat(therapist.hourly_rate) || 0;
    return (hourlyRate * duration) / 60;
  };

  const handleBookAppointment = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setBooking(true);
    
    try {
      // Create appointment
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from('appointments')
        .insert({
          client_id: userProfile?.id,
          therapist_id: therapist.user_id,
          scheduled_at: appointmentDateTime.toISOString(),
          duration: duration,
          status: 'booked',
          notes: notes || null,
        });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success!', 
        'Your appointment has been booked successfully. You will receive a confirmation shortly.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/appointments')
          }
        ]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading booking details...</Text>
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
            <Text style={styles.therapistName}>{therapist?.users?.name || 'Unknown'}</Text>
            <Text style={styles.therapistCredentials}>{therapist?.credentials}</Text>
            <Text style={styles.therapistRate}>₵{therapist?.hourly_rate}/hour</Text>
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
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₵{calculateTotal().toFixed(2)}</Text>
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
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
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
    alignItems: 'center',
  },
  therapistName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  therapistCredentials: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
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
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#14B8A6',
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
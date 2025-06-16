import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Search, Filter, MapPin, Star, Clock, Heart } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type TherapistProfile = Database['public']['Tables']['therapist_profiles']['Row'] & {
  users: Database['public']['Tables']['users']['Row'];
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const specialties = [
    'Stroke Recovery',
    'Autism Support',
    'Hand Therapy',
    'Pediatric OT',
    'Geriatric Care',
    'Mental Health',
    'Physical Rehabilitation',
    'Cognitive Therapy',
  ];

  useEffect(() => {
    loadTherapists();
  }, []);

  const loadTherapists = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          users!therapist_profiles_user_id_fkey (
            id,
            name,
            photo_url,
            location
          )
        `)
        .eq('is_approved', true);

      if (error) throw error;
      
      console.log('Raw data from Supabase:', data); // Add this for debugging
      
      // Filter out profiles without a linked user row
      const validTherapists = (data || []).filter(profile => {
        console.log('Profile:', profile); // Debug each profile
        return profile.users !== null && profile.users?.name;
      });
      
      setTherapists(validTherapists);
    } catch (error) {
      console.error('Error loading therapists:', error);
      Alert.alert('Error', 'Failed to load therapists');
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists
    .filter(therapist => {
      // Ensure we have a valid user object with name
      if (!therapist.users || !therapist.users.name) {
        console.log('Missing user data for therapist:', therapist.id);
        return false;
      }
      return true;
    })
    .filter(therapist => {
      const name = therapist.users.name.toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        name.includes(query) ||
        (therapist.specialties && therapist.specialties.some(s => 
          s.toLowerCase().includes(query)
        ));

      const matchesSpecialty =
        !selectedSpecialty ||
        (therapist.specialties && therapist.specialties.includes(selectedSpecialty));

      return matchesSearch && matchesSpecialty;
    });

  const handleBookAppointment = (therapistId: string) => {
    // Navigate to booking screen (to be implemented)
    Alert.alert('Booking', 'Appointment booking will be implemented in the next update!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Finding therapists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Therapist</Text>
        <Text style={styles.subtitle}>Connect with certified occupational therapists</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyScroll}>
        <View style={styles.specialtyContainer}>
          <TouchableOpacity
            style={[styles.specialtyChip, !selectedSpecialty && styles.selectedSpecialty]}
            onPress={() => setSelectedSpecialty('')}
          >
            <Text style={[styles.specialtyText, !selectedSpecialty && styles.selectedSpecialtyText]}>
              All
            </Text>
          </TouchableOpacity>
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[styles.specialtyChip, selectedSpecialty === specialty && styles.selectedSpecialty]}
              onPress={() => setSelectedSpecialty(specialty === selectedSpecialty ? '' : specialty)}
            >
              <Text style={[styles.specialtyText, selectedSpecialty === specialty && styles.selectedSpecialtyText]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.therapistList} showsVerticalScrollIndicator={false}>
        {filteredTherapists.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No therapists found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search criteria or check back later for new therapists.
            </Text>
          </View>
        ) : (
          <View style={styles.therapistContainer}>
            {filteredTherapists.map((therapist) => {
              // Safety check before rendering
              if (!therapist.users || !therapist.users.name) {
                console.warn('Skipping therapist with missing user data:', therapist.id);
                return null;
              }

              return (
                <View key={therapist.id} style={styles.therapistCard}>
                  <View style={styles.therapistHeader}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {therapist.users.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.therapistInfo}>
                      <Text style={styles.therapistName}>
                        {therapist.users.name}
                      </Text>
                      <View style={styles.locationContainer}>
                        <MapPin size={14} color="#64748b" />
                        <Text style={styles.locationText}>
                          {therapist.users.location || 'Remote'}
                        </Text>
                      </View>
                      <View style={styles.experienceContainer}>
                        <Star size={14} color="#f59e0b" />
                        <Text style={styles.experienceText}>{therapist.experience_years} years exp.</Text>
                      </View>
                    </View>
                    {therapist.hourly_rate && (
                      <View style={styles.rateContainer}>
                        <Text style={styles.rateText}>${therapist.hourly_rate}/hr</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.bio} numberOfLines={3}>
                    {therapist.bio}
                  </Text>

                  <View style={styles.specialtyTags}>
                    {therapist.specialties.slice(0, 3).map((specialty, index) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyTagText}>{specialty}</Text>
                      </View>
                    ))}
                    {therapist.specialties.length > 3 && (
                      <View style={styles.specialtyTag}>
                        <Text style={styles.specialtyTagText}>+{therapist.specialties.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.therapistActions}>
                    <TouchableOpacity style={styles.viewProfileButton}>
                      <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => handleBookAppointment(therapist.id)}
                    >
                      <Clock size={16} color="#ffffff" />
                      <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  specialtyScroll: {
    marginBottom: 20,
  },
  specialtyContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
  },
  specialtyChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedSpecialty: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  specialtyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedSpecialtyText: {
    color: '#ffffff',
  },
  therapistList: {
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
  therapistContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  therapistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  therapistHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  therapistInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  experienceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#14B8A6',
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  specialtyTag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialtyTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#475569',
  },
  therapistActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewProfileText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#14B8A6',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
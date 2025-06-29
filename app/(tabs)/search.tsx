import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Search, Filter, MapPin, Star, Clock, Heart, ChevronRight, Award, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

// Update the type to match your actual data structure
type TherapistProfile = {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[] | null;
  credentials: string;
  experience_years: number;
  availability: any[];
  hourly_rate: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_photo_url: string | null;
  user_location: string | null;
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
      console.log('Loading therapists...');
      
      // Get approved therapist profiles
      const { data: profiles, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('is_approved', true);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Therapist profiles loaded:', profiles?.length);

      if (!profiles || profiles.length === 0) {
        console.log('No approved therapist profiles found');
        setTherapists([]);
        return;
      }

      // Get user data for each therapist
      const userIds = profiles.map(p => p.user_id);
      console.log('Getting users for IDs:', userIds);

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, photo_url, location')
        .in('id', userIds);
      if (userError) {
        console.error('User error:', userError);
        throw userError;
      }

      console.log('Users loaded:', users?.length);

      // Manually join the data
      const therapistsWithUsers = profiles.map(profile => {
        const user = users?.find(u => u.id === profile.user_id);
        
        if (!user) {
          console.log(`No user found for therapist ${profile.id} with user_id ${profile.user_id}`);
        }

        return {
          ...profile,
          user_name: user?.name || 'Unknown',
          user_photo_url: user?.photo_url || null,
          user_location: user?.location || null,
        };
      });

      // Filter out therapists without valid user data
      const validTherapists = therapistsWithUsers.filter(t => t.user_name !== 'Unknown');
      
      console.log('Valid therapists:', validTherapists.length);
      console.log('Sample therapist:', validTherapists[0]);

      setTherapists(validTherapists);

    } catch (error) {
      console.error('Error loading therapists:', error);
      Alert.alert('Error', 'Failed to load therapists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(therapist => {
    const name = therapist.user_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const bio = therapist.bio?.toLowerCase() || '';

    const matchesSearch =
      !searchQuery ||
      name.includes(query) ||
      bio.includes(query) ||
      (therapist.specialties && therapist.specialties.some(s => 
        s.toLowerCase().includes(query)
      ));

    const matchesSpecialty =
      !selectedSpecialty ||
      (therapist.specialties && therapist.specialties.includes(selectedSpecialty));

    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = (therapistId: string) => {
    Alert.alert('Booking', 'Appointment booking will be implemented in the next update!');
  };

  const handleViewProfile = (therapistId: string) => {
    Alert.alert('Profile', 'Profile view will be implemented in the next update!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#14B8A6', '#0d9488']}
          style={styles.loadingGradient}
        >
          <Heart size={32} color="#ffffff" />
        </LinearGradient>
        <Text style={styles.loadingText}>Finding the best therapists for you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#14B8A6', '#0d9488', '#0f766e']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Find Your Therapist</Text>
          <Text style={styles.subtitle}>Connect with certified occupational therapists</Text>
          <Text style={styles.resultCount}>
            {filteredTherapists.length} therapist{filteredTherapists.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </LinearGradient>

      {/* Enhanced Search Container */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#14B8A6" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, specialty, or condition"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Enhanced Filter Button */}
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#14B8A6" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Specialty Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyScroll}>
        <View style={styles.specialtyContainer}>
          <TouchableOpacity
            style={[styles.specialtyChip, !selectedSpecialty && styles.selectedSpecialty]}
            onPress={() => setSelectedSpecialty('')}
          >
            <Text style={[styles.specialtyText, !selectedSpecialty && styles.selectedSpecialtyText]}>
              All Specialties
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

      {/* Enhanced Therapist List */}
      <ScrollView style={styles.therapistList} showsVerticalScrollIndicator={false}>
        {filteredTherapists.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Heart size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No therapists found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search criteria or check back later for new therapists joining our platform.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setSearchQuery('')}>
              <Text style={styles.retryButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.therapistContainer}>
            {filteredTherapists.map((therapist) => {
              return (
                <TouchableOpacity 
                  key={therapist.id} 
                  style={styles.therapistCard}
                  onPress={() => handleViewProfile(therapist.id)}
                  activeOpacity={0.98}
                >
                  {/* Card Header with Enhanced Avatar */}
                  <View style={styles.therapistHeader}>
                    <View style={styles.avatarSection}>
                      {therapist.user_photo_url ? (
                        <Image source={{ uri: therapist.user_photo_url }} style={styles.avatarImage} />
                      ) : (
                        <LinearGradient
                          colors={['#14B8A6', '#0d9488']}
                          style={styles.avatarContainer}
                        >
                          <Text style={styles.avatarText}>
                            {therapist.user_name?.charAt(0).toUpperCase() || 'T'}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.verifiedBadge}>
                        <Award size={12} color="#ffffff" />
                      </View>
                    </View>

                    <View style={styles.therapistInfo}>
                      <View style={styles.nameSection}>
                        <Text style={styles.therapistName}>
                          {therapist.user_name || 'Unknown Therapist'}
                        </Text>
                        <View style={styles.ratingContainer}>
                          <Star size={12} color="#f59e0b" fill="#f59e0b" />
                          <Text style={styles.ratingText}>4.8</Text>
                        </View>
                      </View>
                      
                      <View style={styles.metaInfo}>
                        <View style={styles.locationContainer}>
                          <MapPin size={12} color="#64748b" />
                          <Text style={styles.locationText}>
                            {therapist.user_location || 'Remote'}
                          </Text>
                        </View>
                        <View style={styles.experienceContainer}>
                          <Calendar size={12} color="#64748b" />
                          <Text style={styles.experienceText}>{therapist.experience_years} years</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.priceSection}>
                      <Text style={styles.priceLabel}>From</Text>
                      <Text style={styles.priceText}>₵{therapist.hourly_rate}</Text>
                      <Text style={styles.priceUnit}>/session</Text>
                    </View>
                  </View>

                  {/* Bio Section */}
                  <Text style={styles.bio} numberOfLines={2}>
                    {therapist.bio}
                  </Text>

                  {/* Enhanced Specialty Tags */}
                  {therapist.specialties && therapist.specialties.length > 0 ? (
                    <View style={styles.specialtyTags}>
                      {therapist.specialties.slice(0, 2).map((specialty, index) => (
                        <View key={index} style={styles.specialtyTag}>
                          <Text style={styles.specialtyTagText}>{specialty}</Text>
                        </View>
                      ))}
                      {therapist.specialties.length > 2 && (
                        <View style={styles.moreSpecialtiesTag}>
                          <Text style={styles.moreSpecialtiesText}>+{therapist.specialties.length - 2} more</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.specialtyTags}>
                      <View style={styles.specialtyTag}>
                        <Text style={styles.specialtyTagText}>General OT</Text>
                      </View>
                    </View>
                  )}

                  {/* Credentials */}
                  <View style={styles.credentialsContainer}>
                    <Award size={14} color="#64748b" />
                    <Text style={styles.credentialsText}>{therapist.credentials}</Text>
                  </View>

                  {/* Enhanced Action Buttons */}
                  <View style={styles.therapistActions}>
                    <TouchableOpacity 
                      style={styles.viewProfileButton}
                      onPress={() => handleViewProfile(therapist.id)}
                    >
                      <Text style={styles.viewProfileText}>View Profile</Text>
                      <ChevronRight size={16} color="#14B8A6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => handleBookAppointment(therapist.id)}
                    >
                      <LinearGradient
                        colors={['#14B8A6', '#0d9488']}
                        style={styles.bookButtonGradient}
                      >
                        <Clock size={16} color="#ffffff" />
                        <Text style={styles.bookButtonText}>Book Session</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Available indicator */}
                  <View style={styles.availabilityIndicator}>
                    <View style={styles.availableDot} />
                    <Text style={styles.availabilityText}>Available today</Text>
                  </View>
                </TouchableOpacity>
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
    paddingHorizontal: 24,
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  headerGradient: {
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  clearButton: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  specialtyScroll: {
    marginBottom: 24,
  },
  specialtyContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  specialtyChip: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedSpecialty: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  specialtyText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
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
  therapistContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  therapistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  therapistHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  therapistInfo: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  therapistName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  priceSection: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  priceText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#14B8A6',
  },
  priceUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  bio: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialtyTag: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  specialtyTagText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
  moreSpecialtiesTag: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moreSpecialtiesText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  credentialsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  credentialsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    flex: 1,
  },
  therapistActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  viewProfileText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#14B8A6',
  },
  bookButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  availabilityText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10b981',
  },
});
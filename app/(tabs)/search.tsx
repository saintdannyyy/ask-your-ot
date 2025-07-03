import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Search, Filter, MapPin, Star, Clock, Heart, ChevronRight, Award, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Enhanced type definition that matches our merged data structure
type TherapistProfile = {
  // From therapist_profiles table
  id: string;
  user_id: string;
  bio: string;
  specialties: string[] | null;
  credentials: string;
  experience_years: number;
  availability: any[] | null;
  hourly_rate: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  
  // From users table (merged)
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  location: string | null;
  
  // Additional computed fields
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    photo_url: string | null;
    location: string | null;
  };
};

// Type for the raw response from the RPC function
type RawTherapistResponse = {
  therapist_id?: string;
  id?: string;
  user_id: string;
  bio?: string;
  specialties?: string[] | null;
  credentials?: string;
  experience_years?: number;
  availability?: any[] | null;
  hourly_rate?: number | string;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
  // User fields
  name?: string | null;
  email?: string;
  phone?: string | null;
  photo_url?: string | null;
  location?: string | null;
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
    setLoading(true);
    console.log('🔄 Starting therapist data fetch at:', new Date().toISOString());

    // STEP 1: Fetch approved therapist profiles with user data using SQL JOIN
    console.log('📋 Fetching therapist profiles with user data via get_approved_therapists...');
    const { data: therapistProfiles, error: queryError } = await supabase
      .rpc('get_approved_therapists', {});

    if (queryError) {
      console.error('❌ Therapist profiles fetch error:', JSON.stringify(queryError, null, 2));
      throw new Error(`Failed to fetch therapist profiles: ${queryError.message}`);
    }

    console.log(`✅ Found ${therapistProfiles?.length || 0} approved therapist profiles`);

    // Type the response properly
    const rawProfiles = therapistProfiles as RawTherapistResponse[] | null;

    // Debugging check: Log the raw response
    if (rawProfiles && rawProfiles.length > 0) {
      console.log('📊 Raw therapist profiles response:', JSON.stringify(rawProfiles[0], null, 2));
      console.log('🔍 User IDs found:', rawProfiles.map(p => p.user_id));
      // Log all available keys in the response
      console.log('🔑 Available fields in response:', Object.keys(rawProfiles[0]));
    } else {
      console.warn('⚠️ No approved therapist profiles found in database');
      // Additional check: Verify table counts for debugging
      const { count: therapistCount, error: therapistCountError } = await supabase
        .from('therapist_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true);
      const { count: userCount, error: userCountError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      console.log(`🔍 Therapist profiles count (is_approved=true): ${therapistCount || 0}`);
      if (therapistCountError) console.error('❌ Therapist count error:', JSON.stringify(therapistCountError, null, 2));
      console.log(`🔍 Users count: ${userCount || 0}`);
      if (userCountError) console.error('❌ User count error:', JSON.stringify(userCountError, null, 2));
      setTherapists([]);
      Alert.alert(
        'No Therapists Available',
        'No approved therapists are currently available. Please try again later.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    // STEP 2: Map the joined data to the TherapistProfile structure
    console.log('🔗 Processing therapist profiles...');
    const enrichedTherapists: TherapistProfile[] = rawProfiles
      .map((therapist, index) => {
        // Log raw therapist data for debugging
        console.log(`🔍 Processing therapist ${index + 1} raw data:`, JSON.stringify(therapist, null, 2));

        // Check for missing user data
        if (!therapist.name || therapist.name === null) {
          console.warn(`⚠️ Missing user data for therapist profile ${therapist.therapist_id || therapist.id} (user_id: ${therapist.user_id})`);
          return null;
        }

        // Create merged object with all necessary data
        const enrichedTherapist: TherapistProfile = {
          // Therapist profile data
          id: therapist.therapist_id || therapist.id || '', // Fallback in case therapist_id is named differently
          user_id: therapist.user_id,
          bio: therapist.bio || '',
          specialties: therapist.specialties || [],
          credentials: therapist.credentials || '',
          experience_years: therapist.experience_years || 0,
          availability: therapist.availability || [],
          hourly_rate: therapist.hourly_rate?.toString() || '0',
          is_approved: therapist.is_approved || false,
          created_at: therapist.created_at || new Date().toISOString(),
          updated_at: therapist.updated_at || new Date().toISOString(),

          // User data (personal details)
          name: therapist.name || 'Licensed Therapist',
          email: therapist.email || '',
          phone: therapist.phone || null,
          photo_url: therapist.photo_url || null,
          location: therapist.location || null,

          // Debug reference
          user: {
            id: therapist.user_id,
            name: therapist.name || 'Unknown',
            email: therapist.email || '',
            phone: therapist.phone || null,
            photo_url: therapist.photo_url || null,
            location: therapist.location || null
          }
        };

        console.log(`✅ Successfully processed therapist: ${enrichedTherapist.name}`);
        return enrichedTherapist;
      })
      .filter((therapist): therapist is TherapistProfile => therapist !== null);

    console.log(`✅ Successfully processed ${enrichedTherapists.length} therapist profiles`);

    // Final debugging check
    if (enrichedTherapists.length > 0) {
      console.log('📊 Sample merged profile:', {
        id: enrichedTherapists[0].id,
        name: enrichedTherapists[0].name,
        specialties: enrichedTherapists[0].specialties,
        location: enrichedTherapists[0].location,
        hourly_rate: enrichedTherapists[0].hourly_rate
      });
    } else {
      console.warn('⚠️ No valid therapist profiles after processing');
      console.log('🔍 Checking for null user data in profiles:', 
        rawProfiles.filter(t => !t.name || t.name === null).map(t => ({
          therapist_id: t.therapist_id || t.id,
          user_id: t.user_id
        }))
      );
    }

    // Additional debugging: Check for data integrity
    const profilesWithMissingData = enrichedTherapists.filter(t => 
      !t.name || t.name === 'Licensed Therapist'
    );

    if (profilesWithMissingData.length > 0) {
      console.warn(`⚠️ ${profilesWithMissingData.length} profiles have missing user data`);
    }

    setTherapists(enrichedTherapists);

  } catch (error) {
    console.error('💥 Critical error loading therapists:', JSON.stringify(error, null, 2));

    // Enhanced error debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    Alert.alert(
      'Error Loading Therapists', 
      'Unable to load therapist profiles. Please check your connection and try again.',
      [
        { text: 'Retry', onPress: loadTherapists },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    setTherapists([]);
  } finally {
    setLoading(false);
    console.log('🏁 Therapist data fetch completed');
  }
};

  // FILTERING LOGIC: Search across multiple fields
  const filteredTherapists = therapists.filter(therapist => {
    // Normalize search terms
    const query = searchQuery.toLowerCase().trim();
    const name = therapist.name?.toLowerCase() || '';
    const bio = therapist.bio?.toLowerCase() || '';
    const credentials = therapist.credentials?.toLowerCase() || '';
    const location = therapist.location?.toLowerCase() || '';

    // Search matching logic
    const matchesSearch = !query || (
      name.includes(query) ||
      bio.includes(query) ||
      credentials.includes(query) ||
      location.includes(query) ||
      (therapist.specialties && therapist.specialties.some(specialty => 
        specialty.toLowerCase().includes(query)
      ))
    );

    // Specialty filtering logic  
    const matchesSpecialty = !selectedSpecialty || (
      therapist.specialties && therapist.specialties.includes(selectedSpecialty)
    );

    return matchesSearch && matchesSpecialty;
  });

  // Debug filtered results
  console.log(`🔍 Filtered results: ${filteredTherapists.length} of ${therapists.length} therapists`);

  // NAVIGATION HANDLERS
  const handleBookAppointment = (therapistId: string) => {
    console.log(`🎯 Navigating to booking for therapist: ${therapistId}`);
    router.push(`./appointment/${therapistId}`);
  };

  const handleViewProfile = (therapistId: string) => {
    console.log(`👁️ Navigating to profile for therapist: ${therapistId}`);
    router.push(`../therapist/${therapistId}`);
  };

  // LOADING STATE
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
              placeholder="Search by name, specialty, or location"
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

        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#14B8A6" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Specialty Chips */}
      <View style={styles.specialtySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.specialtyScroll}
          contentContainerStyle={styles.specialtyScrollContent}
        >
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
        </ScrollView>
      </View>

      {/* Enhanced Therapist List */}
      <ScrollView style={styles.therapistList} showsVerticalScrollIndicator={false}>
        {filteredTherapists.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Heart size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No therapists found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedSpecialty 
                ? 'Try adjusting your search criteria or specialty filter.'
                : 'No approved therapists are currently available. Please check back later.'
              }
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setSearchQuery('');
                setSelectedSpecialty('');
              }}
            >
              <Text style={styles.retryButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.therapistContainer}>
            {filteredTherapists.map((therapist) => (
              <TouchableOpacity 
                key={therapist.id} 
                style={styles.therapistCard}
                onPress={() => handleViewProfile(therapist.id)}
                activeOpacity={0.98}
              >
                {/* Card Header with Enhanced Avatar */}
                <View style={styles.therapistHeader}>
                  <View style={styles.avatarSection}>
                    {therapist.photo_url ? (
                      <Image source={{ uri: therapist.photo_url }} style={styles.avatarImage} />
                    ) : (
                      <LinearGradient
                        colors={['#14B8A6', '#0d9488']}
                        style={styles.avatarContainer}
                      >
                        <Text style={styles.avatarText}>
                          {therapist.name?.charAt(0).toUpperCase() || 'T'}
                        </Text>
                      </LinearGradient>
                    )}
                    <View style={styles.verifiedBadge}>
                      <Award size={12} color="#ffffff" />
                    </View>
                  </View>

                  <View style={styles.therapistInfo}>
                    <View style={styles.nameSection}>
                      <Text style={styles.therapistName}>{therapist.name}</Text>
                      <View style={styles.ratingContainer}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.ratingText}>4.8</Text>
                      </View>
                    </View>
                    
                    <View style={styles.metaInfo}>
                      <View style={styles.locationContainer}>
                        <MapPin size={12} color="#64748b" />
                        <Text style={styles.locationText}>
                          {therapist.location || 'Remote'}
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
            ))}
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
  specialtySection: {
    marginBottom: 24,
  },
  specialtyScroll: {
    flexGrow: 0,
  },
  specialtyScrollContent: {
    paddingHorizontal: 24,
    paddingRight: 48,
  },
  specialtyChip: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
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
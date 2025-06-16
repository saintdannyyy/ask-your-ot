import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import { BookOpen, Play, ExternalLink, Filter, Heart, Brain, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type EducationalContent = Database['public']['Tables']['educational_content']['Row'];

export default function EducationScreen() {
  const { userProfile } = useAuth();
  const [content, setContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | 'article' | 'video'>('all');

  const categories = [
    'Stroke Recovery',
    'Autism Support',
    'Hand Therapy',
    'Pediatric OT',
    'Geriatric Care',
    'Mental Health',
    'Physical Rehabilitation',
    'Cognitive Therapy',
  ];

  const isTherapist = userProfile?.role === 'therapist';

  useEffect(() => {
    loadContent();
  }, [selectedCategory, selectedType]);

  const loadContent = async () => {
    try {
      let query = supabase
        .from('educational_content')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.contains('condition_tags', [selectedCategory]);
      }

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load educational content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
  };

  const handleOpenContent = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open content');
    }
  };

  const handleAddContent = () => {
    Alert.alert('Add Content', 'Content creation feature will be implemented in the next update!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play size={16} color="#14B8A6" />;
      case 'article':
        return <BookOpen size={16} color="#14B8A6" />;
      default:
        return <BookOpen size={16} color="#14B8A6" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'stroke recovery':
        return <Heart size={20} color="#EF4444" />;
      case 'autism support':
        return <Users size={20} color="#8B5CF6" />;
      case 'mental health':
        return <Brain size={20} color="#06B6D4" />;
      default:
        return <BookOpen size={20} color="#14B8A6" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading educational content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn & Grow</Text>
        <Text style={styles.subtitle}>Educational resources for your journey</Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'all' && styles.selectedFilter]}
              onPress={() => setSelectedType('all')}
            >
              <Text style={[styles.filterText, selectedType === 'all' && styles.selectedFilterText]}>
                All Content
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'article' && styles.selectedFilter]}
              onPress={() => setSelectedType('article')}
            >
              <BookOpen size={16} color={selectedType === 'article' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.filterText, selectedType === 'article' && styles.selectedFilterText]}>
                Articles
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'video' && styles.selectedFilter]}
              onPress={() => setSelectedType('video')}
            >
              <Play size={16} color={selectedType === 'video' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.filterText, selectedType === 'video' && styles.selectedFilterText]}>
                Videos
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.selectedCategory]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.selectedCategoryText]}>
              All Topics
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, selectedCategory === category && styles.selectedCategory]}
              onPress={() => setSelectedCategory(category === selectedCategory ? '' : category)}
            >
              {getCategoryIcon(category)}
              <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={styles.contentList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#14B8A6']} />}
      >
        {content.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No content found</Text>
            <Text style={styles.emptyDescription}>
              {selectedCategory || selectedType !== 'all' 
                ? 'Try adjusting your filters to find more content.'
                : 'Educational content will appear here as it becomes available.'}
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {content.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.contentCard}
                onPress={() => handleOpenContent(item.url)}
              >
                <View style={styles.contentHeader}>
                  <View style={styles.contentType}>
                    {getTypeIcon(item.type)}
                    <Text style={styles.contentTypeText}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Text>
                  </View>
                  <ExternalLink size={16} color="#64748b" />
                </View>

                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentDescription} numberOfLines={3}>
                  {item.description}
                </Text>

                <View style={styles.contentTags}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                  {item.condition_tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.conditionTag}>
                      <Text style={styles.conditionTagText}>{tag}</Text>
                    </View>
                  ))}
                  {item.condition_tags.length > 2 && (
                    <View style={styles.conditionTag}>
                      <Text style={styles.conditionTagText}>+{item.condition_tags.length - 2}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.contentFooter}>
                  <Text style={styles.readMore}>Tap to {item.type === 'video' ? 'watch' : 'read'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {isTherapist && (
        <View style={styles.floatingActions}>
          <TouchableOpacity 
            style={styles.addContentButton}
            onPress={handleAddContent}
          >
            <BookOpen size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
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
  filtersContainer: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  selectedFilter: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedFilterText: {
    color: '#ffffff',
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  selectedCategory: {
    backgroundColor: '#f1f5f9',
    borderColor: '#14B8A6',
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedCategoryText: {
    color: '#14B8A6',
  },
  contentList: {
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
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 16,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contentTypeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#14B8A6',
    textTransform: 'uppercase',
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 24,
  },
  contentDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  contentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  conditionTag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  conditionTagText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#475569',
  },
  contentFooter: {
    alignItems: 'flex-end',
  },
  readMore: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#14B8A6',
  },
  floatingActions: {
    position: 'absolute',
    bottom: 100,
    right: 24,
  },
  addContentButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
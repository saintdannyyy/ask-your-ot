import { Tabs } from 'expo-router';
import { Chrome as Home, Calendar, MessageCircle, User, Search, BookOpen, SearchIcon, HomeIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { userProfile } = useAuth();
  const isTherapist = userProfile?.role === 'therapist';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#14B8A6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <HomeIcon size={size} color={color} />,
        }}
      />
      
      {!isTherapist && (
        <Tabs.Screen
          name="search"
          options={{
            title: 'Find Therapists',
            tabBarIcon: ({ size, color }) => <SearchIcon size={size} color={color} />,
          }}
        />
      )}

      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => <MessageCircle size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="education"
        options={{
          title: 'Learn',
          tabBarIcon: ({ size, color }) => <BookOpen size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
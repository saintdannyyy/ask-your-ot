import { Tabs } from 'expo-router';
import { Calendar, MessageCircle, User, Search, Home } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { userProfile } = useAuth();
  const isTherapist = userProfile?.role === 'therapist';

  console.log('User Profile:', userProfile); // Debug log
  console.log('Is Therapist:', isTherapist); // Debug log

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
      {/* Home Tab - Always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      
      {/* Search Tab - Only for clients (NOT therapists) */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
          // Hide this tab for therapists
          href: isTherapist ? null : undefined,
        }}
      />

      {/* Appointments Tab - Always visible */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />

      {/* Messages Tab - Always visible */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => <MessageCircle size={size} color={color} />,
        }}
      />

      {/* Profile Tab - Always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />

      {/* Hide education tab from navigation but keep file structure */}
      <Tabs.Screen
        name="education"
        options={{
          href: null, // This hides the tab from navigation
        }}
      />
    </Tabs>
  );
}
import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// Extended user type that includes our custom fields
interface ExtendedUser extends User {
  role?: 'client' | 'therapist';
  name?: string;
  phone?: string;
  location?: string;
  photo_url?: string;
  condition?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  userProfile: ExtendedUser | null; // Add this for compatibility
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>; // Add this method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log('🔍 AuthContext: Getting initial session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔍 AuthContext: Initial session result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        error: error
      });
      
      if (session?.user) {
        console.log('✅ AuthContext: Session found, loading extended data...');
        await loadExtendedUserData(session.user);
      } else {
        console.log('❌ AuthContext: No session found');
        setUser(null);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state change:', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email
        });
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ AuthContext: User signed in, loading extended data...');
          
          // Load extended user data first
          await loadExtendedUserData(session.user);
          
          // Then check profile setup after user data is loaded
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, role, location, photo_url')
            .eq('id', session.user.id)
            .single();

          if (existingUser) {
            const needsProfileSetup = !existingUser.location;
            
            if (needsProfileSetup) {
              console.log('User needs profile completion');
              // Don't navigate here - let the sign-in screen handle it
              // router.replace('/(auth)/setup-profile');
            } else {
              console.log('User profile is complete - going to main app');
              router.replace('/(tabs)');
            }
          } else {
            console.log('No user record found - redirecting to signup');
            router.replace('/(auth)/sign-up');
          }
        }

        if (event === 'SIGNED_OUT') {
          console.log('👋 AuthContext: User signed out');
          setUser(null);
          router.replace('/(auth)/sign-in');
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Enhanced loadExtendedUserData with better error handling
  const loadExtendedUserData = async (authUser: User) => {
    try {
      console.log('🔄 Loading extended user data for:', authUser.email);
      console.log('🔄 User ID:', authUser.id);
      
      // Get custom user data from our database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, name, phone, location, photo_url, condition')
        .eq('id', authUser.id)
        .single();

      console.log('📊 Database query result:', { userData, error });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading extended user data:', error);
        setUser(authUser as ExtendedUser);
        return;
      }

      if (!userData) {
        console.warn('⚠️ No user data found in database for:', authUser.email);
        setUser(authUser as ExtendedUser);
        return;
      }

      // Merge Supabase user with our custom data
      const extendedUser: ExtendedUser = {
        ...authUser,
        ...userData,
      };

      console.log('✅ Extended user data merged:', {
        email: extendedUser.email,
        role: extendedUser.role,
        name: extendedUser.name,
        hasLocation: !!extendedUser.location,
        hasCondition: !!extendedUser.condition,
      });

      setUser(extendedUser);

    } catch (error) {
      console.error('💥 Exception in loadExtendedUserData:', error);
      setUser(authUser as ExtendedUser);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // The auth state change listener will handle navigation
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  // Add updateProfile method that your components expect
  const updateProfile = async (profileData: any) => {
    if (!user) throw new Error('No user logged in');

    console.log('🔄 Updating profile for user:', user.id);
    console.log('🔄 Profile data:', profileData);

    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }

    console.log('✅ Profile updated successfully:', data);

    // Update local state
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  // Add this to your AuthContext or create a separate debug file
  const debugUserData = async (userId: string) => {
    console.log('🐛 Debug: Checking user data for ID:', userId);
    
    // Check if user exists
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('🐛 Debug: User data query result:', { userData, error });
    
    // Check table structure
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('🐛 Debug: Sample user record:', { allUsers, allError });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile: user, // Provide userProfile as an alias to user
      loading, 
      signIn, 
      signOut, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
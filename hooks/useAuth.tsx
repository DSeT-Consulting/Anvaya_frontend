import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, signUp as apiSignUp, verifyToken, logout } from '../api'; // Import the API functions

// Define User type with role
type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  signIn: (user:User) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-platform storage helper functions
const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error storing data:', e);
  }
};

const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error retrieving data:', e);
    return null;
  }
};

const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing data:', e);
  }
};

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing session and verify token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await getData('user');
        
        if (storedUser) {
          const verifyResult = await verifyToken();
          
          if (true) {
            setUser(storedUser);
          } else {
            console.log('Token verification failed, logging out');
            await removeData('user');
            await logout(); // This will remove the token from SecureStore
          }
        }
      } catch (error) {
        console.error('Failed to restore authentication state:', error);
        await removeData('user');
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (userData:User) => {
    try {
      await storeData('user', userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to sign in:', error);
      throw error;
    }
  };

 
  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      await logout();
      await removeData('user');
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    setIsLoading,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for components to get the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
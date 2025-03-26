// app/(authenticated)/index.js
import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '@/components/loader';

export default function AuthenticatedIndex() {
  const { user, isLoading } = useAuth();
  console.log("Auth index",user)
  if (isLoading) {
    return (
      <Loader/>
    );
  }
  
  // Handle unauthenticated state (should be caught by layout, but just in case)
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Redirect based on role
  console.log("redirecting to role....",user.role)
  if (user.role === 'ADMIN') {
    console.log("redirecting to admin")
    return <Redirect href="/(authenticated)/(admin)/dashboard" />;
  } else if (user.role === 'DOCTOR') {
    console.log("redirecting to doctor")
    return <Redirect href="/(authenticated)/(doctor)/dashboard" />;
  } else if (user.role === 'PATIENT') {
    console.log("redirecting to patient")
    return <Redirect href="/(authenticated)/(patient)/dashboard" />;
  }
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#d32f2f' }}>
        Access Error
      </Text>
      <Text style={{ textAlign: 'center' }}>
        Your account doesn't have a valid role assigned. Please contact support for assistance.
      </Text>
    </View>
  );
}
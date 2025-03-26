import { Slot } from "expo-router"
import { AuthProvider } from "@/hooks/useAuth"
import { Image, View, StyleSheet } from "react-native"
import Toast from 'react-native-toast-message';
import { useEffect } from "react";
export default function RootLayout() {

  return (
    <AuthProvider>
      <View style={styles.container}>
        <Slot />
      </View>
      <Toast/>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },

})


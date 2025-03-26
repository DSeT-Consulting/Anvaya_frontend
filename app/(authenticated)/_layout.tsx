"use client"

import { Redirect,Stack, router } from "expo-router"
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../../hooks/useAuth"
import { useState, useCallback } from "react"
import { Loader } from "@/components/loader"
import { Image } from "react-native"



export default function AuthenticatedLayout() {
  const { user, signOut, isLoading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);  // Moved up
  
  console.log("Auth Layout", user);

  if (isLoading) {
    return <Loader/>;
  }
  
  if (!user) {
    return <Redirect href="/login" />;
  }

  
  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
        <View style={styles.headerLogoContainer}>
          <Image source={require("../../assets/images/icon.jpeg")} style={styles.headerLogo} resizeMode="contain" />
        </View>
        <Text style={styles.headerTitle}>Anvaya</Text>
        <TouchableOpacity style={styles.infoIconContainer} onPress={() => router.push("/info")}>
          <MaterialIcons name="info-outline" size={24} color="#fff" />
        </TouchableOpacity>
        </View>
        <View style={styles.logoContainer}>
        <Pressable onPress={() => setMenuVisible(true)}>
          <MaterialIcons name="account-circle" size={28} color="#fff" />
        </Pressable>
        </View>
      </View>

      {/* Sign Out Modal */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <Pressable onPress={() => {
              setMenuVisible(false);
              signOut();
            }}>
              <Text style={styles.menuItem}>Sign Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Stack screenOptions={{
        headerShown:false,
      }}>
        <Stack.Screen name="index" redirect={!user}  
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(admin)/dashboard" 
          redirect={user?.role !== "ADMIN"} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(doctor)/dashboard" 
          redirect={user?.role !== "DOCTOR"} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(patient)/dashboard" 
          redirect={user?.role !== "PATIENT"} 
          options={{ headerShown: false }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer:{
    display:"flex",
    flexDirection:"row",
    alignItems:"center"
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 5,
  },
  menuItem: {
    fontSize: 16,
    paddingVertical: 8,
    color: '#2196F3',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
})
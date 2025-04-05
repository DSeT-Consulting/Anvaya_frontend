"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Image,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

// -- Import your existing API calls (including verifyToken & logout)
import { verifyToken, logout } from "@/api"  // Adjust the path as needed

export default function Dashboard() {
  const router = useRouter()
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [doctorName, setDoctorName] = useState<string>("") // store the fetched name
  const isWeb = Platform.OS === "web"

  useEffect(() => {
    // Listen for screen dimension changes
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  // 1) Fetch the logged-in doctor name
  useEffect(() => {
    const fetchDoctorName = async () => {
      const tokenRes = await verifyToken() 
      // tokenRes.data might look like: { valid: boolean, user?: { name: string, email: string, role: 'doctor' } }
      if (tokenRes.success && tokenRes.data?.user) {
        setDoctorName(tokenRes.data.user.name || "")
      } else {
        // If token is invalid or no user, optionally push to login
        // router.push("/login")
      }
    }
    fetchDoctorName()
  }, [])

  // Calculate columns for responsive grid
  const getColumns = () => {
    if (dimensions.width > 1024) return 3
    if (dimensions.width > 600) return 2
    return 1
  }

  // Main grid menu items
  const menuItems = [
    {
      title: "Register New Patient",
      description: "Add a new patient to the system",
      icon: "person-add" as const,
      route: "/register-patient",
    },
    {
      title: "Search Patients",
      description: "Find and manage patient records",
      icon: "search" as const,
      route: "/search-patients",
    },
  ]

  // Toggle hamburger dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Sign out
  const handleSignOut = async () => {
    await logout() // remove token from storage
    router.push("/login") // navigate to login
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Single White Header Bar --- */}
      <View style={styles.header}>
        {/* Centered Brand (logo + name) */}
        <View style={styles.brandContainer}>
          <Image
            source={require("../assets/images/icon.jpeg")} // Adjust path as needed
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Anvaya</Text>
        </View>

        {/* Right side icons: Info, Greeting, Hamburger */}
        <View style={styles.rightControls}>
          {/* Info icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/info")}
          >
            <MaterialIcons name="info-outline" size={24} color="#000" />
          </TouchableOpacity>

          {/* Greeting with doctor's name */}
          <View style={styles.profileContainer}>
            <MaterialIcons
              name="account-circle"
              size={24}
              color="#000"
              style={styles.profileIcon}
            />
            <Text style={styles.greeting}>
              Hi {doctorName || "Doctor"}
            </Text>
          </View>

          {/* Hamburger icon for dropdown */}
          <TouchableOpacity style={styles.iconButton} onPress={toggleDropdown}>
            <MaterialIcons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Dropdown Menu (Settings + Sign Out) --- */}
      {isDropdownOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setIsDropdownOpen(false)
              router.push("/settings")
            }}
          >
            <Text style={styles.dropdownText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleSignOut}>
            <Text style={styles.dropdownText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- Main Content (Cards) --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { gap: dimensions.width > 600 ? 24 : 16 },
        ]}
      >
        <View
          style={[
            styles.grid,
            {
              gap: dimensions.width > 600 ? 24 : 16,
              ...(isWeb && {
                display: "grid",
                gridAutoRows: "auto",
                gridTemplateColumns: `repeat(${getColumns()}, 3fr)`,
              }),
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, isWeb && webStyles.webCard]}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name={item.icon} size={28} color="#4B0082" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const webStyles = {
  webCard: {
    transition: "0.3s",
    cursor: "pointer",
  } as const,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },

  /* -------------------- HEADER -------------------- */
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  profileIcon: {
    marginRight: 4,
  },
  greeting: {
    fontSize: 16,
    color: "#000",
  },

  /* -------------------- DROPDOWN MENU -------------------- */
  dropdownMenu: {
    position: "absolute",
    top: 58, // just below the header
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },

  /* -------------------- MAIN CONTENT -------------------- */
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },

  grid: {
    // fallback for mobile if not on web
    flexDirection: "column",
  },

  /* -------------------- CARD -------------------- */
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    minHeight: 140,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
  },
})

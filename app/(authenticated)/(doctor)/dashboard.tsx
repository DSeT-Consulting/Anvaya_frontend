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
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

// Example: you might fetch actual doctor’s name from user profile or context
const doctorName = "John"

export default function Dashboard() {
  const router = useRouter()
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isWeb = Platform.OS === "web"

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  // Calculate number of columns based on screen width
  const getColumns = () => {
    if (dimensions.width > 1024) return 3
    if (dimensions.width > 600) return 2
    return 1
  }

  // Cards in the main grid (Settings removed and placed in dropdown)
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

  const handleSignOut = () => {
    // Sign-out logic here (e.g., clear tokens, call logout endpoint, etc.)
    // Then navigate to login screen
    router.push("/login")
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anvaya</Text>

        {/* Right section: profile icon, greeting, hamburger */}
        <View style={styles.rightContainer}>
          <MaterialIcons name="account-circle" size={24} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.greeting}>Hi {doctorName}</Text>
          <TouchableOpacity onPress={toggleDropdown} style={styles.hamburgerButton}>
            <MaterialIcons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown menu (Settings + Sign Out) */}
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

      {/* Main content (ScrollView + Card Grid) */}
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

// Web-specific styles
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
  // Header: white background, black text
  header: {
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "#000",
    marginRight: 12,
  },
  hamburgerButton: {
    padding: 4,
  },

  // Dropdown menu
  dropdownMenu: {
    position: "absolute",
    top: 64,
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

  // Main scroll content
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  grid: {
    // For mobile fallback
    flexDirection: "column",
  },

  // Card styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 140,
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

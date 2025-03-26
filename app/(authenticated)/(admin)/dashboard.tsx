"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, Platform } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export default function Dashboard() {
  const router = useRouter()
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))
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

  const menuItems:{
    title: string
    description: string
    icon: 'person-add' | 'search' | 'bar-chart' | 'settings' | 'sync'
    route: any
  }[] = [
    // {
    //   title: "Register New Patient",
    //   description: "Add a new patient to the system",
    //   icon: "person-add",
    //   route: "/register-patient",
    // },
    // {
    //   title: "Search Patients",
    //   description: "Find and manage patient records",
    //   icon: "search",
    //   route: "/search-patients",
    // },
    {
      title: "Reports & Analytics",
      description: "View health insights and trends",
      icon: "bar-chart",
      route: "/report-analytics",
    },
    {
      title: "Settings",
      description: "Configure app preferences",
      icon: "settings",
      route: "/(admin)/settings",
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
    

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { gap: dimensions.width > 600 ? 24 : 16 }]}
      >
        <View
          style={[
            styles.grid,
            {
              gap: dimensions.width > 600 ? 24 : 16,
              ...(isWeb && { 
                gridAutoRows: "auto",
                gridTemplateColumns: `repeat(${getColumns()}, 3fr)` }),
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card]}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name={item.icon} size={28} color="#2196F3" />
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
  grid: {
    display:"grid"
  },
  webCard: {
    transition: "0.3s",
    cursor: "pointer",
  },
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
  },
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
    marginBottom: 16,
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


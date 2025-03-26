"use client"

import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Image } from "react-native"

export default function InfoScreen() {
  const currentYear = new Date().getFullYear()

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/images/dsetlogo.webp")} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.title}>Anvaya</Text>
          <Text style={styles.version}>Version 1.0.0</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Copyright Information</Text>
          <Text style={styles.paragraph}>© {currentYear} DSeT Consulting Private Limited. All rights reserved.</Text>
          <Text style={styles.paragraph}>
            This application and its content are protected by copyright laws and international treaties. Unauthorized
            reproduction or distribution of this application, or any portion of it, may result in severe civil and
            criminal penalties, and will be prosecuted to the maximum extent possible under law.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Company Information</Text>
          <Text style={styles.paragraph}>DSeT Consulting Private Limited</Text>
          <Text style={styles.paragraph}>
            A leading provider of healthcare technology solutions, dedicated to improving patient care through
            innovative digital platforms.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Legal Notice</Text>
          <Text style={styles.paragraph}>
            The information contained in this application is for general information purposes only. While we endeavor to
            keep the information up to date and correct, we make no representations or warranties of any kind, express
            or implied, about the completeness, accuracy, reliability, suitability or availability with respect to the
            application or the information, products, services, or related graphics contained in the application for any
            purpose.
          </Text>

          <View style={styles.divider} />

          {/* <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.paragraph}>For any inquiries regarding this application, please contact:</Text>
          <Text style={styles.contactInfo}>support@dsetconsulting.com</Text>
          <Text style={styles.contactInfo}>www.dsetconsulting.com</Text> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
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
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 200,
    height: 60,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  version: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 14,
    color: "#2196F3",
    marginBottom: 5,
  },
})


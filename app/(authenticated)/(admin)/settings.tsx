"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"

export default function DoctorSettings() {
  const [language, setLanguage] = useState("English")
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const isWeb = Platform.OS === "web"

  const languages = ["English", "Spanish", "French", "German", "Chinese"]

  // Close dropdown when clicking outside
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isWeb && showLanguageDropdown) {
      const handleClickOutside = (event: any) => {
        // @ts-ignore
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowLanguageDropdown(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isWeb, showLanguageDropdown])

  const handleSyncNow = () => {
    console.log("Syncing data now...")
    // Add your sync logic here
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Language Setting */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <MaterialIcons name="language" size={24} color="#757575" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Language</Text>
          </View>
          <View style={styles.settingControl}>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
              // @ts-ignore
              ref={dropdownRef}
            >
              <Text style={styles.languageText}>{language}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#757575" />
            </TouchableOpacity>

            {/* Language Dropdown - Using Modal on mobile */}
            {Platform.OS !== "web" && showLanguageDropdown ? (
              <Modal
                visible={showLanguageDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguageDropdown(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageDropdown(false)}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Language</Text>
                      <TouchableOpacity onPress={() => setShowLanguageDropdown(false)}>
                        <MaterialIcons name="close" size={24} color="#333" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dropdownList}>
                      {languages.map((lang, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dropdownItem,
                            language === lang && styles.dropdownItemSelected,
                            index === languages.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setLanguage(lang)
                            setShowLanguageDropdown(false)
                          }}
                        >
                          <Text style={[styles.dropdownItemText, language === lang && styles.dropdownItemTextSelected]}>
                            {lang}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </Pressable>
              </Modal>
            ) : null}

            {/* Web dropdown */}
            {Platform.OS === "web" && showLanguageDropdown ? (
              <View style={styles.languageDropdown}>
                <View style={styles.dropdownList}>
                  {languages.map((lang, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        language === lang && styles.dropdownItemSelected,
                        index === languages.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setLanguage(lang)
                        setShowLanguageDropdown(false)
                      }}
                    >
                      <Text style={[styles.dropdownItemText, language === lang && styles.dropdownItemTextSelected]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Offline Mode Setting */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <MaterialIcons name="wifi-off" size={24} color="#757575" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Offline Mode</Text>
            <Text style={styles.settingDescription}>Enable to work without internet connection</Text>
          </View>
          <View style={styles.settingControl}>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: "#D1D1D1", true: "#2196F3" }}
              thumbColor={"#FFFFFF"}
              ios_backgroundColor="#D1D1D1"
              style={isWeb ? { transform: [{ scale: 1.2 }] } : {}}
            />
          </View>
        </View>

        {/* Auto Sync Setting */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconContainer}>
            <MaterialIcons name="sync" size={24} color="#757575" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Auto Sync</Text>
            <Text style={styles.settingDescription}>Automatically sync data when online</Text>
          </View>
          <View style={styles.settingControl}>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: "#D1D1D1", true: "#2196F3" }}
              thumbColor={"#FFFFFF"}
              ios_backgroundColor="#D1D1D1"
              style={isWeb ? { transform: [{ scale: 1.2 }] } : {}}
            />
          </View>
        </View>

        {/* Sync Now Button */}
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow}>
          <MaterialIcons name="sync" size={20} color="#FFFFFF" style={styles.syncButtonIcon} />
          <Text style={styles.syncButtonText}>SYNC DATA NOW</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#333333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    position: "relative",
    zIndex: 1,
  },
  settingIconContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#757575",
  },
  settingControl: {
    marginLeft: 16,
    position: "relative",
    zIndex: 2,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    backgroundColor: "#FFFFFF",
  },
  languageText: {
    fontSize: 16,
    color: "#333333",
    marginRight: 8,
  },
  languageDropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    width: 150,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    overflow: "hidden",
  },
  // New dropdown styles
  dropdownList: {
    width: "100%",
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333333",
  },
  dropdownItemTextSelected: {
    color: "#2196F3",
    fontWeight: "500",
  },
  syncButton: {
    backgroundColor: "#2196F3",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  syncButtonIcon: {
    marginRight: 8,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  // Modal styles for mobile
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333333",
  },
  // Old styles kept for reference
  languageOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  selectedLanguageOption: {
    backgroundColor: "#E3F2FD",
  },
  languageOptionText: {
    fontSize: 14,
    color: "#333333",
  },
  selectedLanguageOptionText: {
    color: "#2196F3",
    fontWeight: "500",
  },
})


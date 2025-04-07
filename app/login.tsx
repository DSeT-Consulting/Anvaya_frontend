"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuth } from "@/hooks/useAuth"
import { login } from "@/api"
import { showToast } from "@/utils/toast"

/**
 * FloatingLabelInput Component
 */
function FloatingLabelInput({
  label,
  iconName,
  value,
  onChangeText,
  secureTextEntry,
  showPasswordToggle,
  showPassword,
  setShowPassword,
  isWeb,
}) {
  const [isFocused, setIsFocused] = useState(false)

  // Animated value: 0 = unfocused/empty, 1 = focused or has value
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: false, // We need layout animations
    }).start()
  }, [isFocused, value, labelAnim])

  // Interpolate label’s position & font size
  const labelStyle = {
    position: "absolute",
    left: iconName ? 40 : 16, // Shift label if there's an icon
    zIndex: 2, // Keep label above text input
    pointerEvents: "none", // Allow clicks/taps to pass through label
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 0],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#9e9e9e", "#007BFF"],
    }),
  }

  return (
    <View style={[styles.inputContainer, isWeb && styles.webInputWrapper]}>
      {/* Optional left icon */}
      {iconName && (
        <MaterialIcons
          name={iconName}
          size={20}
          color="#007BFF"
          style={styles.inputIcon}
        />
      )}

      {/* Floating label */}
      <Animated.Text style={labelStyle}>{label}</Animated.Text>

      {/* TextInput */}
      <TextInput
        style={[styles.textField, isWeb && styles.webInputStyle]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        autoCapitalize="none"
      />

      {/* Show/hide password icon (if applicable) */}
      {showPasswordToggle && (
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.visibilityIcon}
        >
          <MaterialIcons
            name={showPassword ? "visibility" : "visibility-off"}
            size={20}
            color="#757575"
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

/**
 * Main Login Screen
 */
export default function LoginScreen() {
  const [emailPh, setEmailPh] = useState("")
  const [password, setPassword] = useState("")
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))
  const { signIn, isLoading, setIsLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  // New state for role selection and animation
  const [selectedRole, setSelectedRole] = useState("doctor")
  const toggleAnim = useRef(new Animated.Value(0)).current
  const [toggleWidth, setToggleWidth] = useState(0)

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  const isWeb = Platform.OS === "web"
  const isWideScreen = windowDimensions.width > 768

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const res = await login({ email: emailPh, password })
      if (res.success) {
        showToast("success", "Login Successful")
        await signIn(res.data.user)
        router.replace("/(authenticated)")
      } else {
        showToast("error", res.message ?? "Login Failed")
      }
    } catch (e) {
      showToast("error", "Login Failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUpDoctor = () => {
    router.push("/register-doctor")
  }

  const handleSignUpPatient = () => {
    router.push("/register-patient")
  }

  // Handler for toggling between roles with fluid animation
  const handleToggle = (role) => {
    setSelectedRole(role)
    Animated.timing(toggleAnim, {
      toValue: role === "doctor" ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require("../assets/images/icon.jpeg")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerTitle}>Anvaya</Text>
        <TouchableOpacity
          style={styles.infoIconContainer}
          onPress={() => router.push("/info")}
        >
          <MaterialIcons name="info-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.loginCard,
              isWideScreen ? { width: 500, maxWidth: "90%" } : { width: "100%" },
            ]}
          >
            {/* Logo / Title */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="person" size={40} color="#007BFF" />
              </View>
              <Text style={styles.welcomeText}>Welcome to Anvaya</Text>
              <Text style={styles.subtitleText}>Please login to continue</Text>
            </View>

            {/* Fluid Toggle for Doctor / Patient */}
            <View
              style={styles.toggleContainer}
              onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[
                  styles.toggleIndicator,
                  {
                    width: toggleWidth / 2,
                    left: toggleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, toggleWidth / 2],
                    }),
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => handleToggle("doctor")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedRole === "doctor" && styles.activeToggleText,
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => handleToggle("patient")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedRole === "patient" && styles.activeToggleText,
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>
            </View>

            {/* Doctor ID / Patient ID */}
            <FloatingLabelInput
              label="Email Address"
              iconName="email"
              value={emailPh}
              onChangeText={setEmailPh}
              isWeb={isWeb}
            />

            {/* Password */}
            <FloatingLabelInput
              label="Password"
              iconName="lock"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isWeb={isWeb}
            />

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isWeb && styles.webButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Login Securely</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Section */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>New here? Register with Anvaya</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.signupButton,
                styles.doctorButton,
                isWeb && styles.webButton,
              ]}
              onPress={handleSignUpDoctor}
            >
              <MaterialIcons
                name="medical-services"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.signupButtonText}>Doctor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signupButton,
                styles.patientButton,
                isWeb && styles.webButton,
              ]}
              onPress={handleSignUpPatient}
            >
              <MaterialIcons
                name="person"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.signupButtonText}>Patient</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>AI ChatBot</Text>
          </TouchableOpacity>
          <Text style={styles.footerLink}>Powered by</Text>
          <Image
            source={require("../assets/images/dsetlogo.webp")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  /* Removes outline on web */
  webInputStyle: {
    outlineWidth: 0,
    outlineColor: "transparent",
    outlineStyle: "none",
  },

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  /* Header (white top bar) */
  header: {
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerTitle: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  infoIconContainer: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  headerLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  /* Content layout */
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
  },

  /* Intro logo & text */
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: "#666",
  },

  /* FloatingLabelInput container */
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  textField: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  visibilityIcon: {
    paddingLeft: 8,
  },
  webInputWrapper: {
    minHeight: 50,
  },

  /* Buttons */
  loginButton: {
    backgroundColor: "#4B0082",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  webButton: {
    paddingVertical: 16,
    cursor: "pointer",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
    opacity: 0.7,
  },

  /* Sign up text and buttons */
  signupContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  signupText: {
    fontSize: 14,
    color: "#666",
  },
  signupButton: {
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  doctorButton: {
    backgroundColor: "#007BFF",
  },
  patientButton: {
    backgroundColor: "#6F42C1",
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },

  /* Toggle styles for Doctor/Patient */
  toggleContainer: {
    flexDirection: "row",
    position: "relative",
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    marginBottom: 20,
    overflow: "hidden",
  },
  toggleIndicator: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#4B0082",
    borderRadius: 20,
  },
  toggleButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontSize: 16,
    color: "#4B0082",
    fontWeight: "bold",
  },
  activeToggleText: {
    color: "#fff",
  },

  /* Footer */
  footer: {
    padding: 12,
    backgroundColor: "#f0f0f0",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerLink: {
    fontSize: 14,
    color: "#555",
    marginHorizontal: 5,
  },
  footerLogo: {
    width: 60,
    height: 20,
    opacity: 0.8,
    marginLeft: 5,
  },
})

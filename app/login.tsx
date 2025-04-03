"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuth } from "@/hooks/useAuth"
import { login } from "@/api"
import { showToast } from "@/utils/toast"
import { Image } from "react-native"

export default function LoginScreen() {
  const [emailPh, setEmailPh] = useState("")
  const [password, setPassword] = useState("")
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))
  const { signIn, isLoading, setIsLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  const isWeb = Platform.OS === "web"
  const isWideScreen = windowDimensions.width > 768

  const handleLogin = async () => {
    console.log("Login with:", emailPh, password)
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
      console.log("Login Error:", e)
      showToast("error", "Login Failed")
    } finally {
      setIsLoading(false)
    }
    console.log("Login")
  }

  const handleSignUpDoctor = () => {
    router.push("/register-doctor")
  }

  const handleSignUpPatient = () => {
    router.push("/register-patient")
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Image source={require("../assets/images/icon.jpeg")} style={styles.headerLogo} resizeMode="contain" />
        </View>
        <Text style={styles.headerTitle}>Anvaya</Text>
        <TouchableOpacity style={styles.infoIconContainer} onPress={() => router.push("/info")}>
          <MaterialIcons name="info-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainerHeader} pointerEvents="none">
        <Image source={require("../assets/images/dsetlogo.webp")} style={styles.logo} resizeMode="contain" />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.loginCard, isWideScreen ? { width: 500, maxWidth: "90%" } : { width: "100%" }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="person" size={40} color="#2196F3" />
              </View>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.subtitleText}>Please login to continue</Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, isWeb && styles.webInputWrapper]}>
                <MaterialIcons name="email" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Phone no. or Email"
                  value={emailPh}
                  placeholderTextColor={"#9e9e9e"}
                  onChangeText={setEmailPh}
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputWrapper, isWeb && styles.webInputWrapper]}>
                <MaterialIcons name="lock" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Password"
                  value={password}
                  placeholderTextColor={"#9e9e9e"}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                  <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#757575" />
                </TouchableOpacity>
              </View>

              {/* <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                style={[styles.loginButton, isWeb && styles.webButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
              </View>

              <TouchableOpacity
                style={[styles.signupButton, styles.doctorButton, isWeb && styles.webButton]}
                onPress={handleSignUpDoctor}
              >
                <MaterialIcons name="medical-services" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.signupButtonText}>Sign Up as Doctor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signupButton, styles.patientButton, isWeb && styles.webButton]}
                onPress={handleSignUpPatient}
              >
                <MaterialIcons name="person" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.signupButtonText}>Sign Up as Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const webStyles = {
  webInputStyle: {
    outlineWidth: 0,
    outlineColor: "transparent",
    outlineStyle: "none",
  },
}
const styles = StyleSheet.create({
  logoContainerHeader: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    paddingTop: 10,
  },
  logo: {
    width: 250,
    height: 50,
    opacity: 0.3, // Makes the logo transparent
  },
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
    flex: 1,
    textAlign: "center",
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f9ff",
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
  inputContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  webInputWrapper: {
    paddingVertical: 8,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  webInput: {
    height: 30,
    width: "100%",
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#2196F3",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
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
  signupContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  signupText: {
    fontSize: 14,
    color: "#666",
  },
  signupButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  adminButton: {
    backgroundColor: "#4CAF50", // Green color for admin
  },
  doctorButton: {
    backgroundColor: "#FF5722", // Orange color for doctor
  },
  patientButton: {
    backgroundColor: "#FF9800", // Amber color for patient
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
    opacity: 0.7,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  visibilityIcon: {
    padding: 4,
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
})

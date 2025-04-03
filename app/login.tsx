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
                <MaterialIcons name="person-add" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.signupButtonText}>Sign Up as Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#2196F3" },
  headerLogoContainer: { flex: 1 },
  headerLogo: { width: 40, height: 40 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  infoIconContainer: { padding: 8 },
  logoContainerHeader: { alignItems: "center", marginTop: 20 },
  logo: { width: 150, height: 100 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  loginCard: { backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center" },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center" },
  welcomeText: { fontSize: 22, fontWeight: "bold" },
  subtitleText: { fontSize: 16, color: "#757575" },
  inputContainer: { width: "100%" },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 8 },
  loginButton: { backgroundColor: "#2196F3", padding: 10, borderRadius: 5, alignItems: "center" },
  loginButtonText: { color: "#fff", fontWeight: "bold" },
  signupContainer: { marginTop: 10 },
  signupButton: { padding: 10, borderRadius: 5, alignItems: "center", flexDirection: "row", marginTop: 10 },
  signupButtonText: { marginLeft: 5, color: "#fff", fontWeight: "bold" },
  doctorButton: { backgroundColor: "#4CAF50" },
  patientButton: { backgroundColor: "#FF9800" },
})


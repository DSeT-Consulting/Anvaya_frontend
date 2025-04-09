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
// Using Picker for language selection
import { Picker } from "@react-native-picker/picker"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useAuth } from "@/hooks/useAuth"
import { login } from "@/api"
import { showToast } from "@/utils/toast"

// Translation dictionaries for English, Hindi, and Kannada
const translations = {
  en: {
    screenTitle: "Welcome to Anavaya",
    subtitle: "Please login to continue",
    mobileEmail: "Mobile or email",
    otpPassword: "OTP or Password",
    loginButton: "Login Securely",
    register: "New here? Register with Anavaya",
  },
  hi: {
    screenTitle: "अनवाया में आपका स्वागत है",
    subtitle: "कृपया लॉगिन करें",
    mobileEmail: "मोबाइल या ईमेल",
    otpPassword: "ओटीपी या पासवर्ड",
    loginButton: "सुरक्षित रूप से लॉगिन करें",
    register: "नया यहां? अनवाया के साथ रजिस्टर करें",
  },
  kn: {
    screenTitle: "ಅನವಾಯಕ್ಕೆ ಸ್ವಾಗತ",
    subtitle: "ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ",
    mobileEmail: "ಮೊಬೈಲ್ ಅಥವಾ ಇಮೇಲ್",
    otpPassword: "OTP ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್",
    loginButton: "ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಮಾಡಿ",
    register: "ಹೊಸವಸ್ತೂ? ಅನವಾಯದೊಂದಿಗೆ ನೋಂದಣಿ ಮಾಡಿ",
  },
}

const roleTranslations = {
  doctor: {
    en: "Doctor",
    hi: "डॉक्टर",
    kn: "ಡಾಕ್ಟರ್",
  },
  patient: {
    en: "Patient",
    hi: "मरीज",
    kn: "ರೋಗಿ",
  },
}

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
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()
  }, [isFocused, value, labelAnim])

  const labelStyle = {
    position: "absolute",
    left: iconName ? 40 : 16,
    zIndex: 2,
    pointerEvents: "none",
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
      outputRange: ["#9e9e9e", "#0077B6"],
    }),
  }

  return (
    <View style={[styles.inputContainer, isWeb && styles.webInputWrapper]}>
      {iconName && (
        <MaterialIcons
          name={iconName}
          size={20}
          color="#0077B6"
          style={styles.inputIcon}
        />
      )}
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[styles.textField, isWeb && styles.webTextField]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        autoCapitalize="none"
      />
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
  // Language selection state: "en", "hi", or "kn"
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [emailPh, setEmailPh] = useState("")
  const [password, setPassword] = useState("")
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))
  const { signIn, isLoading, setIsLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  // Role toggle state
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

  // When registration is triggered, pass along the current language preference
  const handleRegister = () => {
    if (selectedRole === "doctor") {
      router.push(`/register-doctor?lang=${selectedLanguage}`)
    } else {
      router.push(`/register-patient?lang=${selectedLanguage}`)
    }
  }

  const handleToggle = (role) => {
    setSelectedRole(role)
    Animated.timing(toggleAnim, {
      toValue: role === "doctor" ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang)
  }

  return (
    <LinearGradient
      colors={["#03045E", "#0077B6", "#00B4D8", "#90E0EF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogoContainer}>
            <Image
              source={require("../assets/images/icon.jpeg")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Anavya</Text>
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
            {/* Login Card with blue gradient */}
            <LinearGradient
              colors={["#03045E", "#0077B6", "#00B4D8", "#90E0EF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginCard}
            >
              {/* Doctor Asset */}
              <View style={styles.doctorAssetContainer}>
                <Image
                  source={require("../assets/images/doctor.png")}
                  style={styles.doctorAsset}
                  resizeMode="contain"
                />
              </View>
              {/* Title & Subtitle */}
              <Text style={styles.screenTitle}>
                {translations[selectedLanguage].screenTitle}
              </Text>
              <Text style={styles.subtitleText}>
                {translations[selectedLanguage].subtitle}
              </Text>
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
              {/* Role Toggle */}
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
                    {roleTranslations.doctor[selectedLanguage]}
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
                    {roleTranslations.patient[selectedLanguage]}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Floating Inputs */}
              <FloatingLabelInput
                label={translations[selectedLanguage].mobileEmail}
                iconName="email"
                value={emailPh}
                onChangeText={setEmailPh}
                isWeb={isWeb}
              />
              <FloatingLabelInput
                label={translations[selectedLanguage].otpPassword}
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
                  <Text style={styles.loginButtonText}>
                    {translations[selectedLanguage].loginButton}
                  </Text>
                )}
              </TouchableOpacity>
              {/* Registration Link */}
              <TouchableOpacity onPress={handleRegister} style={{ marginTop: 10 }}>
                <Text style={styles.registerText}>
                  {translations[selectedLanguage].register}
                </Text>
              </TouchableOpacity>
              {/* Language Dropdown */}
              <View style={styles.languageDropdownContainer}>
                <Picker
                  selectedValue={selectedLanguage}
                  style={styles.languagePicker}
                  dropdownIconColor="#fff"
                  onValueChange={(itemValue) => handleLanguageChange(itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="English" value="en" />
                  <Picker.Item label="हिन्दी" value="hi" />
                  <Picker.Item label="ಕನ್ನಡ" value="kn" />
                </Picker>
              </View>
            </LinearGradient>
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
    </LinearGradient>
  )
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },

  /* Language Dropdown */
  languageDropdownContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  languagePicker: {
    height: 40,
    color: "#fff",
    width: "100%",
    backgroundColor: "#000",
  },

  /* Header */
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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  /* Login Card with gradient */
  loginCard: {
    borderRadius: 10,
    padding: 24,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    width: "90%",
    maxWidth: 400,
  },

  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#fff",
  },
  subtitleText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    color: "#fff",
  },

  /* Doctor Asset */
  doctorAssetContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  doctorAsset: {
    width: 80,
    height: 80,
  },

  /* Divider */
  dividerContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  divider: {
    width: "80%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
  },

  /* Toggle Container (Box within a Box) */
  toggleContainer: {
    flexDirection: "row",
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0077B6",
    marginBottom: 20,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
  },
  toggleIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "#90E0EF",
    borderRadius: 20,
  },
  toggleButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  toggleText: {
    fontSize: 16,
    color: "#03045E",
    fontWeight: "bold",
  },
  activeToggleText: {
    color: "#fff",
  },

  /* FloatingLabelInput */
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
  webTextField: {
    outlineWidth: 0,
    outlineStyle: "none",
    outlineColor: "transparent",
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

  /* Login Button */
  loginButton: {
    backgroundColor: "#0077B6",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  webButton: {
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

  /* Registration link text */
  registerText: {
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
    textDecorationLine: "underline",
    fontWeight: "600",
  },

  /* Language Dropdown styling */
  languageDropdownContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  languagePicker: {
    height: 40,
    color: "#fff",
    width: "100%",
    backgroundColor: "#000",
  },

  /* Footer */
  footer: {
    backgroundColor: "transparent",
    padding: 12,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerLink: {
    fontSize: 14,
    color: "#fff",
    marginHorizontal: 5,
  },
  footerLogo: {
    width: 60,
    height: 20,
    opacity: 0.8,
    marginLeft: 5,
  },
})

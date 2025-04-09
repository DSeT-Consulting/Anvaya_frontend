"use client"

import { useState, useEffect, useRef } from "react"
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
  Modal,
  Pressable,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from "react-native"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import * as Yup from "yup"
import { createPatient } from "@/api"
import { showToast } from "@/utils/toast"

// -------------------------
// Define form data interface
// -------------------------
interface PatientFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  age: string
  gender: string
}

// -------------------------
// Define errors interface
// -------------------------
interface FormErrors {
  [key: string]: string | undefined
}

// -------------------------
// Define validation schema with Yup
// -------------------------
const PatientSchema = Yup.object().shape({
  name: Yup.string().required("Name is required").min(3, "Name must be at least 3 characters"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .test("passwords-match", "Passwords must match", function (value) {
      return this.parent.password === value
    }),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(/^\+?[0-9]{10,15}$/, "Phone number must be 10-15 digits"),
  age: Yup.string()
    .required("Age is required")
    .test("is-valid-age", "Age must be between 1 and 120", function (value) {
      const age = parseInt(value)
      return !isNaN(age) && age > 0 && age <= 120
    }),
  gender: Yup.string().required("Gender is required").oneOf(["male", "female", "other"], "Please select a valid gender"),
})

// -------------------------
// FloatingLabelInput Component
// -------------------------
function FloatingLabelInput({
  label,
  iconName,
  value,
  onChangeText,
  secureTextEntry,
  isPasswordToggleEnabled = false,
  showPassword,
  setShowPassword,
  error,
  onBlur,
}: {
  label: string
  iconName: keyof typeof MaterialIcons.glyphMap
  value: string
  onChangeText: (val: string) => void
  secureTextEntry?: boolean
  isPasswordToggleEnabled?: boolean
  showPassword?: boolean
  setShowPassword?: (val: boolean) => void
  error?: string
  onBlur?: () => void
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

  // Label style matching the doctors.tsx UI
  const labelStyle = {
    position: "absolute" as const,
    left: iconName ? 40 : 16,
    pointerEvents: "none" as const,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -2],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#9e9e9e", "#4B0082"],
    }),
  }

  return (
    <View style={[styles.floatingContainer, error && styles.inputError]}>
      {iconName && (
        <MaterialIcons name={iconName} size={20} color="#4B0082" style={styles.floatingIcon} />
      )}
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[styles.floatingInput, webStyles.webInputStyle]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false)
          onBlur?.()
        }}
        secureTextEntry={secureTextEntry && !showPassword}
        autoCapitalize="none"
      />
      {isPasswordToggleEnabled && setShowPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color="#757575" />
        </TouchableOpacity>
      )}
    </View>
  )
}

// -------------------------
// PasswordCheckItem Subcomponent
// -------------------------
function PasswordCheckItem({ label, isValid }: { label: string; isValid: boolean }) {
  return (
    <View style={styles.passwordCheckRow}>
      {isValid ? (
        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginRight: 6 }} />
      ) : (
        <Ionicons name="radio-button-off" size={18} color="#9e9e9e" style={{ marginRight: 6 }} />
      )}
      <Text style={{ color: isValid ? "#333" : "#9e9e9e", fontSize: 14 }}>{label}</Text>
    </View>
  )
}

// -------------------------
// Main RegisterPatient Component
// -------------------------
export default function RegisterPatient() {
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    age: "",
    gender: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isFormValid, setIsFormValid] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [passwordChecks, setPasswordChecks] = useState<PasswordChecks>({
    length: false,
    lower: false,
    upper: false,
    digit: false,
  })

  // Country selection (if needed)
  const COUNTRIES = [
    { name: "United States", code: "US", callingCode: "+1", flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", callingCode: "+44", flag: "🇬🇧" },
    { name: "India", code: "IN", callingCode: "+91", flag: "🇮🇳" },
    { name: "Japan", code: "JP", callingCode: "+81", flag: "🇯🇵" },
    { name: "Australia", code: "AU", callingCode: "+61", flag: "🇦🇺" },
  ]
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[2])
  const [showCountryModal, setShowCountryModal] = useState(false)

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))
  const isWideScreen = windowDimensions.width > 768
  const isWeb = Platform.OS === "web"

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  useEffect(() => {
    validateForm()
  }, [formData])

  const validateForm = async (): Promise<void> => {
    try {
      await PatientSchema.validate(formData, { abortEarly: false })
      const hasErrors = Object.values(errors).some((error) => error !== undefined)
      const allFieldsFilled = Object.values(formData).every((value) => value.trim() !== "")
      setIsFormValid(!hasErrors && allFieldsFilled)
    } catch {
      setIsFormValid(false)
    }
  }

  const validateField = async (field: keyof PatientFormData, value: string): Promise<boolean> => {
    try {
      // For confirmPassword, do not validate on every keystroke; rely on onBlur
      if (field !== "confirmPassword") {
        const fieldSchema = Yup.object().shape({
          [field]: PatientSchema.fields[field],
        })
        await fieldSchema.validate({ [field]: value }, { abortEarly: false })
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
      // For password, if confirmPassword is non-empty, re-validate it on blur
      if (field === "password" && formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords must match" }))
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
        }
      }
      validateForm()
      return true
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const fieldError = error.inner.find((err) => err.path === field)
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError.message }))
        }
      }
      validateForm()
      return false
    }
  }

  const handleInputChange = (field: keyof PatientFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // For confirmPassword, skip validation on every keystroke; validation will occur on blur.
    if (field !== "confirmPassword") {
      validateField(field, value)
    }
    if (field === "password") {
      checkPasswordRequirements(value)
    }
  }

  const handleBlur = (field: keyof PatientFormData) => (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
    validateField(field, formData[field])
  }

  const checkPasswordRequirements = (pass: string) => {
    const length = pass.length >= 8
    const lower = /[a-z]/.test(pass)
    const upper = /[A-Z]/.test(pass)
    const digit = /\d/.test(pass)
    setPasswordChecks({ length, lower, upper, digit })
  }

  const handleRegister = async (): Promise<void> => {
    setIsSubmitting(true)
    try {
      // Rely on Yup validation for confirmPassword
      await PatientSchema.validate(formData, { abortEarly: false })
      console.log("Registering patient with:", formData)
      const res = await createPatient(formData)
      if (res.success) {
        showToast("success", "Registration successful")
        router.push("/login")
      } else {
        showToast("error", res.message ?? "Registration failed")
      }
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const validationErrors: FormErrors = {}
        error.inner.forEach((err) => {
          if (err.path) {
            validationErrors[err.path] = err.message
          }
        })
        setErrors(validationErrors)
      } else {
        showToast("error", "An error occurred. Please try again.")
        console.error("Registration error:", error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectCountry = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    setShowCountryModal(false)
  }

  // Gender selection options
  const GENDER_OPTIONS = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ]
  const selectGender = (gender: string) => {
    handleInputChange("gender", gender)
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
          <TouchableOpacity style={styles.infoIconContainer} onPress={() => router.push("/info")}>
            <MaterialIcons name="info-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={["#03045E", "#0077B6", "#00B4D8", "#90E0EF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerCard}
            >
              {/* Header Logo & Title */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <MaterialIcons name="person" size={40} color="#4B0082" />
                </View>
                <Text style={styles.welcomeText}>Patient Registration</Text>
                <Text style={styles.subtitleText}>Create your patient account</Text>
              </View>

              {/* Form Fields */}
              <FloatingLabelInput
                label="Full Name"
                iconName="person"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                error={errors.name}
                onBlur={handleBlur("name")}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <FloatingLabelInput
                label="Email"
                iconName="email"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                error={errors.email}
                onBlur={handleBlur("email")}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <FloatingLabelInput
                label="Password"
                iconName="lock"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry
                isPasswordToggleEnabled
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                error={errors.password}
                onBlur={handleBlur("password")}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Password Checks UI */}
              <View style={styles.passwordChecksContainer}>
                <PasswordCheckItem label="Min. 8 characters" isValid={passwordChecks.length} />
                <PasswordCheckItem label="At least one lowercase letter" isValid={passwordChecks.lower} />
                <PasswordCheckItem label="At least one uppercase letter" isValid={passwordChecks.upper} />
                <PasswordCheckItem label="At least one number" isValid={passwordChecks.digit} />
              </View>

              <FloatingLabelInput
                label="Confirm Password"
                iconName="lock"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                secureTextEntry
                isPasswordToggleEnabled
                showPassword={showConfirmPassword}
                setShowPassword={setShowConfirmPassword}
                error={errors.confirmPassword}
                onBlur={handleBlur("confirmPassword")}
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

              <FloatingLabelInput
                label="Phone Number"
                iconName="phone"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange("phoneNumber", text)}
                error={errors.phoneNumber}
                onBlur={handleBlur("phoneNumber")}
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              <FloatingLabelInput
                label="Age"
                iconName="calendar-today"
                value={formData.age}
                onChangeText={(text) => handleInputChange("age", text)}
                error={errors.age}
                onBlur={handleBlur("age")}
              />
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

              {/* Gender Selection */}
              <Text style={styles.sectionLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      formData.gender === option.value && styles.selectedGenderOption,
                    ]}
                    onPress={() => selectGender(option.value)}
                  >
                    <Text style={[styles.genderText, formData.gender === option.value && styles.selectedGenderText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, (!isFormValid || isSubmitting) && styles.disabledButton]}
                onPress={handleRegister}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Register</Text>
                )}
              </TouchableOpacity>

              {/* Extra Link: Not a Patient? Register as Doctor */}
              <TouchableOpacity onPress={() => router.push("/register-doctor")} style={{ marginTop: 10 }}>
                <Text style={styles.alternateLinkText}>Not a Patient? Register as Doctor</Text>
              </TouchableOpacity>

              {/* Already have an account? */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Country Selection Modal */}
        <Modal visible={showCountryModal} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Country</Text>
              {COUNTRIES.map((country) => (
                <Pressable key={country.callingCode} style={styles.modalOption} onPress={() => handleSelectCountry(country)}>
                  <Text style={styles.modalOptionText}>
                    {country.flag} {country.name} ({country.callingCode})
                  </Text>
                </Pressable>
              ))}
              <TouchableOpacity onPress={() => setShowCountryModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  )
}

// -------------------------
// Web style overrides for inputs (remove focus outline)
// -------------------------
const webStyles = {
  webInputStyle: {
    outlineWidth: 0,
    outlineStyle: "none",
    outlineColor: "transparent",
  },
}

// -------------------------
// Styles
// -------------------------
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
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
  /* Registration Card with blue gradient background */
  registerCard: {
    borderRadius: 10,
    padding: 24,
    alignSelf: "center",
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  /* Logo & Header in card */
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
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
    textAlign: "center",
    marginBottom: 16,
  },
  /* Floating Label Input */
  floatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  floatingIcon: {
    marginRight: 12,
  },
  floatingInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
    outlineStyle: "none",
    outlineWidth: 0,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
  },
  /* Field error text */
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  /* Password Checks */
  passwordChecksContainer: {
    marginBottom: 16,
    paddingLeft: 10,
  },
  passwordCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  /* Section Label (Gender) */
  sectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  /* Gender selection */
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedGenderOption: {
    backgroundColor: "#e0f0ff",
    borderColor: "#4B0082",
  },
  genderText: {
    color: "#666",
    fontSize: 14,
  },
  selectedGenderText: {
    color: "#4B0082",
    fontWeight: "bold",
  },
  /* Rounded Register Button */
  registerButton: {
    backgroundColor: "#4B0082",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  webButton: {
    cursor: "pointer",
  },
  /* Login Link (Already have an account) */
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#4B0082",
    fontWeight: "500",
  },
  /* Alternate Link: Not a Patient? Register as Doctor */
  alternateLinkText: {
    fontSize: 14,
    color: "#fff",
    textDecorationLine: "underline",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  /* Modal for country selection */
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#333",
  },
  modalCancel: {
    marginTop: 12,
    alignSelf: "flex-end",
  },
  modalCancelText: {
    fontSize: 14,
    color: "#007BFF",
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

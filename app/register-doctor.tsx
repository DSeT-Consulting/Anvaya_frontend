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
  Modal,
  Pressable,
} from "react-native"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import * as Yup from "yup"
import { createDoctor } from "@/api"
import { showToast } from "@/utils/toast"

// ---------- Define a custom list of countries ----------
const COUNTRIES = [
  { name: "United States", code: "US", callingCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", callingCode: "+44", flag: "🇬🇧" },
  { name: "India", code: "IN", callingCode: "+91", flag: "🇮🇳" },
  { name: "Japan", code: "JP", callingCode: "+81", flag: "🇯🇵" },
  { name: "Australia", code: "AU", callingCode: "+61", flag: "🇦🇺" },
]

// ---------- Basic phone auto-format (optional) ----------
function autoFormatPhoneNumber(input: string): string {
  // Remove non-digit characters
  const digits = input.replace(/\D/g, "")
  let formatted = digits
  if (digits.length > 0) {
    if (digits.length <= 3) {
      formatted = `(${digits}`
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }
  return formatted
}

// ---------- Validation Schema ----------
const DoctorSchema = Yup.object().shape({
  name: Yup.string().required("Name is required").min(3, "Name must be at least 3 characters"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  doctorId: Yup.string()
    .required("Doctor's ID is required")
    .min(3, "Doctor's ID must be at least 3 characters"),
  specialty: Yup.string()
    .required("Field of Expertise is required")
    .min(3, "Specialty must be at least 3 characters"),
  affiliatedHospital: Yup.string()
    .required("Affiliated Hospital is required")
    .min(3, "Hospital name must be at least 3 characters"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .min(10, "Phone number must be at least 10 digits"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /[a-z]/,
      "Must contain at least one lowercase letter"
    )
    .matches(
      /[A-Z]/,
      "Must contain at least one uppercase letter"
    )
    .matches(
      /\d/,
      "Must contain at least one number"
    ),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .test("passwords-match", "Passwords must match", function (value) {
      return this.parent.password === value
    }),
})

// ---------- DoctorFormData Interface ----------
interface DoctorFormData {
  name: string
  email: string
  doctorId: string
  specialty: string
  affiliatedHospital: string
  phoneNumber: string
  password: string
  confirmPassword: string
}

// ---------- FormErrors Type ----------
type FormErrors = { [key: string]: string | undefined }

// ---------- PasswordCheck Interface ----------
interface PasswordChecks {
  length: boolean
  lower: boolean
  upper: boolean
  digit: boolean
}

// ---------- FloatingLabelInput Component ----------
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

  const labelStyle = {
    position: "absolute" as const,
    left: iconName ? 40 : 16,
    pointerEvents: "none",
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
        style={styles.floatingInput}
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
          <MaterialIcons
            name={showPassword ? "visibility-off" : "visibility"}
            size={22}
            color="#757575"
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ---------- Main Component ----------
export default function RegisterDoctor() {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: "",
    email: "",
    doctorId: "",
    specialty: "",
    affiliatedHospital: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Show/hide password toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // For password checks UI
  const [passwordChecks, setPasswordChecks] = useState<PasswordChecks>({
    length: false,
    lower: false,
    upper: false,
    digit: false,
  })

  // For phone country code
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryModal, setShowCountryModal] = useState(false)

  // For responsive layout
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))
  const isWideScreen = windowDimensions.width > 768

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  // Re-validate entire form on changes
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords must match" }))
    } else if (formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
    validateForm()
  }, [formData])

  // Check if the password meets each requirement
  const checkPasswordRequirements = (pass: string) => {
    const length = pass.length >= 8
    const lower = /[a-z]/.test(pass)
    const upper = /[A-Z]/.test(pass)
    const digit = /\d/.test(pass)
    setPasswordChecks({ length, lower, upper, digit })
  }

  const validateForm = async () => {
    try {
      await DoctorSchema.validate(formData, { abortEarly: false })
      const hasErrors = Object.values(errors).some((err) => err !== undefined)
      const allFieldsFilled = Object.values(formData).every((val) => val.trim() !== "")
      setIsFormValid(!hasErrors && allFieldsFilled)
    } catch {
      setIsFormValid(false)
    }
  }

  const validateField = async (field: keyof DoctorFormData, value: string) => {
    try {
      // If confirmPassword is typed
      if (field === "confirmPassword") {
        if (value !== formData.password) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords must match" }))
          return
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
        }
      }

      const fieldSchema = Yup.object().shape({
        [field]: DoctorSchema.fields[field],
      })
      await fieldSchema.validate({ [field]: value }, { abortEarly: false })

      setErrors((prev) => ({ ...prev, [field]: undefined }))

      // If password changed, re-check confirmPassword
      if (field === "password" && formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords must match" }))
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
        }
      }
      validateForm()
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const fieldError = err.inner.find((e) => e.path === field)
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError.message }))
        }
      }
      validateForm()
    }
  }

  const handleInputChange = (field: keyof DoctorFormData, rawValue: string) => {
    let value = rawValue
    // If editing phoneNumber, optionally auto-format
    if (field === "phoneNumber") {
      value = autoFormatPhoneNumber(rawValue)
    }
    // If password is typed, check requirements
    if (field === "password") {
      checkPasswordRequirements(value)
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const handleBlur = (field: keyof DoctorFormData) => () => {
    validateField(field, formData[field])
  }

  const handleRegister = async () => {
    setIsSubmitting(true)
    try {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords must match" }))
        setIsSubmitting(false)
        return
      }

      await DoctorSchema.validate(formData, { abortEarly: false })
      // Combine selected country calling code with phone number
      const finalPhone = `${selectedCountry.callingCode} ${formData.phoneNumber}`

      console.log("Registering doctor with:", { ...formData, phoneNumber: finalPhone })
      const res = await createDoctor({ ...formData, phoneNumber: finalPhone })
      if (res.success) {
        showToast("success", "Registration successful")
        router.push("/login")
      } else {
        showToast("error", res.message ?? "Registration failed")
      }
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const validationErrors: FormErrors = {}
        error.inner.forEach((err: Yup.ValidationError) => {
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

  // Country code modal selection handler
  const handleSelectCountry = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    setShowCountryModal(false)
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
        <TouchableOpacity style={styles.infoIconContainer} onPress={() => router.push("/info")}>
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
              styles.registerCard,
              isWideScreen ? { width: 500, maxWidth: "90%" } : { width: "100%" },
            ]}
          >
            {/* Title / Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="medical-services" size={40} color="#4B0082" />
              </View>
              <Text style={styles.welcomeText}>Doctor Registration</Text>
              <Text style={styles.subtitleText}>Create your doctor account</Text>
            </View>

            <View style={styles.inputContainer}>
              {/* Name */}
              <FloatingLabelInput
                label="Name"
                iconName="person"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                error={errors.name}
                onBlur={handleBlur("name")}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              {/* Email */}
              <FloatingLabelInput
                label="Email"
                iconName="email"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                error={errors.email}
                onBlur={handleBlur("email")}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              {/* Doctor's ID */}
              <FloatingLabelInput
                label="Doctor's ID"
                iconName="badge"
                value={formData.doctorId}
                onChangeText={(text) => handleInputChange("doctorId", text)}
                error={errors.doctorId}
                onBlur={handleBlur("doctorId")}
              />
              {errors.doctorId && <Text style={styles.errorText}>{errors.doctorId}</Text>}

              {/* Specialty */}
              <FloatingLabelInput
                label="Field of Expertise / Specialty"
                iconName="school"
                value={formData.specialty}
                onChangeText={(text) => handleInputChange("specialty", text)}
                error={errors.specialty}
                onBlur={handleBlur("specialty")}
              />
              {errors.specialty && <Text style={styles.errorText}>{errors.specialty}</Text>}

              {/* Affiliated Hospital */}
              <FloatingLabelInput
                label="Affiliated Hospital"
                iconName="local-hospital"
                value={formData.affiliatedHospital}
                onChangeText={(text) => handleInputChange("affiliatedHospital", text)}
                error={errors.affiliatedHospital}
                onBlur={handleBlur("affiliatedHospital")}
              />
              {errors.affiliatedHospital && (
                <Text style={styles.errorText}>{errors.affiliatedHospital}</Text>
              )}

              {/* Country code + phone number */}
              <View style={[styles.inputWrapper, errors.phoneNumber && styles.inputError]}>
                <MaterialIcons name="phone" size={20} color="#4B0082" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.countryCodeSelector}
                  onPress={() => setShowCountryModal(true)}
                >
                  <Text style={styles.countryCodeText}>
                    {selectedCountry.flag} {selectedCountry.callingCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#333" />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Phone number"
                  placeholderTextColor="#9e9e9e"
                  value={formData.phoneNumber}
                  onChangeText={(text) => handleInputChange("phoneNumber", text)}
                  keyboardType="number-pad"
                  onBlur={handleBlur("phoneNumber")}
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              {/* Password */}
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
              {/* Shown as bullet points with check/cross icons (or just check vs. neutral) */}
              <View style={styles.passwordChecksContainer}>
                <PasswordCheckItem
                  label="Min. 8 characters"
                  isValid={passwordChecks.length}
                />
                <PasswordCheckItem
                  label="Min. one lowercase character"
                  isValid={passwordChecks.lower}
                />
                <PasswordCheckItem
                  label="Min. one uppercase character"
                  isValid={passwordChecks.upper}
                />
                <PasswordCheckItem
                  label="Min. one number"
                  isValid={passwordChecks.digit}
                />
              </View>

              {/* Confirm Password */}
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
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Register button */}
              <TouchableOpacity
                style={[
                  styles.roundedButton,
                  (isSubmitting || !isFormValid) && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.roundedButtonText}>Register</Text>
                )}
              </TouchableOpacity>

              {/* Already have an account? */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Already have an account?</Text>
              </View>
              <TouchableOpacity
                style={[styles.signupButton, isSubmitting && styles.disabledButton]}
                onPress={() => router.push("/login")}
                disabled={isSubmitting}
              >
                <MaterialIcons name="person" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.signupButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country selection modal */}
      <Modal visible={showCountryModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Country</Text>
            {COUNTRIES.map((country) => (
              <Pressable
                key={country.callingCode}
                style={styles.modalOption}
                onPress={() => handleSelectCountry(country)}
              >
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
  )
}

/** 
 * A small sub-component for each password check row:
 * - label: text to display (e.g. "Min. 8 characters")
 * - isValid: whether the requirement is met
 */
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

// ---------- Styles ----------
const styles = StyleSheet.create({
  // Remove black focus outline on web
  floatingInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
    outlineStyle: "none",
    outlineWidth: 0,
  },

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  // Header
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

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    justifyContent: "center",
  },
  registerCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Card header
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

  // Floating label container
  floatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  floatingIcon: {
    marginRight: 12,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
  },

  // For phone
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },

  // Country code
  countryCodeSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    color: "#333",
    marginRight: 2,
  },

  // Buttons
  roundedButton: {
    backgroundColor: "#4B0082",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  roundedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
    opacity: 0.7,
  },

  // Sign up
  signupContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  signupText: {
    fontSize: 14,
    color: "#666",
  },
  signupButton: {
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#007BFF",
  },
  buttonIcon: {
    marginRight: 8,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Error text
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 6,
  },

  // Password checks container
  passwordChecksContainer: {
    marginBottom: 16,
    paddingLeft: 10,
  },
  passwordCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  // Modal
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
})

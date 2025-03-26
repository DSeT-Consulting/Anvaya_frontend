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
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  Image,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuth } from "@/hooks/useAuth"
import * as Yup from "yup"
import { createDoctor } from "@/api"
import { showToast } from "@/utils/toast"

// Define form data interface
interface DoctorFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
}

// Define errors interface
interface FormErrors {
  [key: string]: string | undefined
}

// Define validation schema with Yup
const DoctorSchema = Yup.object().shape({
  name: Yup.string().required("name is required").min(3, "name must be at least 3 characters"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .test("passwords-match", "Passwords must match", function (value) {
      return this.parent.password === value
    }),
  phoneNumber: Yup.string()
    .required("phoneNumber number is required")
    .matches(/^\+?[0-9]{10,15}$/, "phoneNumber number must be 10 digits"),
})

export default function RegisterDoctor() {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isFormValid, setIsFormValid] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  // Effect to validate confirmPassword when password changes
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords must match",
      }))
    } else if (formData.confirmPassword) {
      // Only clear the error if confirmPassword has a value
      setErrors((prev) => ({
        ...prev,
        confirmPassword: undefined,
      }))
    }

    validateForm()
  }, [formData])

  const isWeb = Platform.OS === "web"
  const isWideScreen = windowDimensions.width > 768

  // Function to check if all form fields are valid
  const validateForm = async (): Promise<void> => {
    try {
      await DoctorSchema.validate(formData, { abortEarly: false })

      // Check if there are any errors in the errors state
      const hasErrors = Object.values(errors).some((error) => error !== undefined)

      // Check if all required fields have values
      const allFieldsFilled = Object.values(formData).every((value) => value.trim() !== "")

      setIsFormValid(!hasErrors && allFieldsFilled)
    } catch (error) {
      setIsFormValid(false)
    }
  }

  const validateField = async (field: keyof DoctorFormData, value: string): Promise<boolean> => {
    try {
      // Special handling for confirmPassword
      if (field === "confirmPassword") {
        if (value !== formData.password) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords must match",
          }))
          return false
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: undefined,
          }))
          return true
        }
      }

      // Create a temporary object with just the field being validated
      const fieldSchema = Yup.object().shape({
        [field]: DoctorSchema.fields[field],
      })

      await fieldSchema.validate({ [field]: value }, { abortEarly: false })

      // Clear error for this field if validation passes
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))

      // If password changed and confirmPassword exists, validate confirmPassword too
      if (field === "password" && formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords must match",
          }))
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: undefined,
          }))
        }
      }

      // Check overall form validity after field validation
      validateForm()

      return true
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const fieldError = error.inner.find((err) => err.path === field)
        if (fieldError) {
          setErrors((prev) => ({
            ...prev,
            [field]: fieldError.message,
          }))
        }
      }

      // Check overall form validity after field validation
      validateForm()

      return false
    }
  }

  const handleInputChange = (field: keyof DoctorFormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Validate field on change
    validateField(field, value)
  }

  const handleBlur =
    (field: keyof DoctorFormData) =>
    (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
      validateField(field, formData[field])
    }

  const handleRegister = async (): Promise<void> => {
    setIsSubmitting(true)

    // Manual validation for confirmPassword
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords must match",
      }))
      setIsSubmitting(false)
      return
    }

    try {
      // Validate all fields
      await DoctorSchema.validate(formData, { abortEarly: false })
      console.log("Registering doctor with:", formData)
      const res = await createDoctor(formData)
      if(res.success){
        showToast("success", "Registration successful")
        router.push("/login")
      }else{
        showToast("error", res.message??"Registration failed")
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
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
          <View style={[styles.registerCard, isWideScreen ? { width: 500, maxWidth: "90%" } : { width: "100%" }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="medical-services" size={40} color="#2196F3" />
              </View>
              <Text style={styles.welcomeText}>Doctor Registration</Text>
              <Text style={styles.subtitleText}>Create your doctor account</Text>
            </View>

            <View style={styles.inputContainer}>
              {/* name */}
              <View
                style={[styles.inputWrapper, isWeb && styles.webInputWrapper, errors.name && styles.inputError]}
              >
                <MaterialIcons name="person" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Name"
                  placeholderTextColor={"#9e9e9e"}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  autoCapitalize="none"
                  onBlur={handleBlur("name")}
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              {/* Email */}
              <View style={[styles.inputWrapper, isWeb && styles.webInputWrapper, errors.email && styles.inputError]}>
                <MaterialIcons name="email" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Email"
                  placeholderTextColor={"#9e9e9e"}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange("email", text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={handleBlur("email")}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

              {/* Password */}
              <View
                style={[styles.inputWrapper, isWeb && styles.webInputWrapper, errors.password && styles.inputError]}
              >
                <MaterialIcons name="lock" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Password"
                  placeholderTextColor={"#9e9e9e"}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  secureTextEntry={!showPassword}
                  onBlur={handleBlur("password")}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.visibilityToggle}>
                  <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color="#757575" />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

              {/* Confirm Password */}
              <View
                style={[
                  styles.inputWrapper,
                  isWeb && styles.webInputWrapper,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <MaterialIcons name="lock" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  placeholderTextColor={"#9e9e9e"}
                  onChangeText={(text) => handleInputChange("confirmPassword", text)}
                  secureTextEntry={!showConfirmPassword}
                  onBlur={handleBlur("confirmPassword")}
                />
                <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.visibilityToggle}>
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility-off" : "visibility"}
                    size={22}
                    color="#757575"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

              {/* phoneNumber */}
              <View style={[styles.inputWrapper, isWeb && styles.webInputWrapper, errors.phoneNumber && styles.inputError]}>
                <MaterialIcons name="phone" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isWeb && webStyles.webInputStyle]}
                  placeholder="Phone no."
                  placeholderTextColor={"#9e9e9e"}
                  value={formData.phoneNumber}
                  onChangeText={(text) => handleInputChange("phoneNumber", text)}
                  keyboardType="number-pad"
                  onBlur={handleBlur("phoneNumber")}
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isWeb && styles.webButton,
                  (!isFormValid || isSubmitting) && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Register</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
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
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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
  logoContainerHeader: {
    position: "absolute",
    top: 60,
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
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
  registerCard: {
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
    marginBottom: 24,
    
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
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
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
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
  visibilityToggle: {
    padding: 4,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
    opacity: 0.7,
  },
  webButton: {
    paddingVertical: 16,
    cursor: "pointer",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "500",
  },
})


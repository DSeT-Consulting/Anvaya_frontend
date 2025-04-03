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
import { createPatient } from "@/api"
import { showToast } from "@/utils/toast"

interface PatientFormData {
  name: string
  email: string
  phoneNumber: string
}

interface FormErrors {
  [key: string]: string | undefined
}

const PatientSchema = Yup.object().shape({
  name: Yup.string().required("Name is required").min(3, "Name must be at least 3 characters"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(/^[0-9]{10,15}$/, "Phone number must be 10-15 digits"),
})

export default function RegisterPatient() {
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    email: "",
    phoneNumber: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isFormValid, setIsFormValid] = useState<boolean>(false)
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"))

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  const isWideScreen = windowDimensions.width > 768

  const validateForm = async (): Promise<void> => {
    try {
      await PatientSchema.validate(formData, { abortEarly: false })
      setIsFormValid(true)
    } catch {
      setIsFormValid(false)
    }
  }

  useEffect(() => {
    validateForm()
  }, [formData])

  const handleInputChange = (field: keyof PatientFormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRegister = async (): Promise<void> => {
    setIsSubmitting(true)
    try {
      await PatientSchema.validate(formData, { abortEarly: false })
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
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.registerCard, isWideScreen ? { width: 500 } : { width: "100%" }]}>
          <Text style={styles.welcomeText}>Patient Registration</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={formData.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange("email", text)}
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange("phoneNumber", text)}
            keyboardType="number-pad"
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

          <TouchableOpacity
            style={[styles.registerButton, !isFormValid || isSubmitting ? styles.disabledButton : {}]}
            onPress={handleRegister}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Register</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  registerCard: { backgroundColor: "#fff", padding: 24, borderRadius: 8 },
  welcomeText: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  input: { backgroundColor: "#f5f5f5", padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: "#D32F2F", fontSize: 12, marginBottom: 8 },
  registerButton: { backgroundColor: "#2196F3", padding: 14, borderRadius: 8, alignItems: "center" },
  disabledButton: { backgroundColor: "#BDBDBD" },
  registerButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
})

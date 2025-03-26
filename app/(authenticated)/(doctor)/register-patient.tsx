"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { createPatient, uploadDocument } from "@/api"
import { showToast } from "@/utils/toast"
import * as yup from "yup"
import * as DocumentPicker from "expo-document-picker"

// Interface for the form data structure
interface PatientCreateRequest {
  personal_details: {
    email: string
    name: string
    password: string
    phoneNumber: string
    adharCard: string
    gender?: "MALE" | "FEMALE" | "OTHER"
    age?: number
    address?: string
    pincode?: number
  }
  medical_history?: {
    preExistingConditions?: string
    currentMedications?: string
  }
  symptoms_vitals: {
    appointmentDate: Date
    symptoms?: string[]
    bloodPressure?: string
    temperature?: string
    sugarLevel?: string
    pulseRate?: string
  }
  doctor_notes?: {
    diagnosis?: string
    treatmentAdvice?: string
    nextAppointmentDate?: Date
  }
}

// Validation schemas for each section
const personalDetailsSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  phoneNumber: yup
    .string()
    .required("Phone Number number is required")
    .matches(/^\+?[0-9]{10,15}$/, "phoneNumber number must be 10 digits"),
  gender: yup.string().required("Gender is required"),
  age: yup.number().required("Age is required"),
  adharCard: yup
    .string()
    .required("Aadhar card is required")
    .matches(/^\d{12}$/, "Aadhar card must be exactly 12 digits"),
  pincode: yup
    .number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .test("len", "Pincode must be exactly 6 digits", (val) => val === undefined || val.toString().length === 6),
  address: yup.string(),
})

const medicalHistorySchema = yup.object().shape({
  preExistingConditions: yup.string(),
  currentMedications: yup.string(),
})

const symptomsVitalsSchema = yup.object().shape({
  appointmentDate: yup.date().required("Appointment date is required"),
  symptoms: yup.array().of(yup.string()),
  bloodPressure: yup.string(),
  temperature: yup.string(),
  sugarLevel: yup.string(),
  pulseRate: yup.string(),
})

const doctorNotesSchema = yup.object().shape({
  diagnosis: yup.string(),
  treatmentAdvice: yup.string(),
  nextAppointmentDate: yup.date(),
})

const steps = [
  {
    id: "personal",
    label: "Personal Details",
    icon: "person",
  },
  {
    id: "medical",
    label: "Medical History",
    icon: "medical-services",
  },
  {
    id: "symptoms",
    label: "Symptoms & Vitals",
    icon: "favorite",
  },
  {
    id: "notes",
    label: "Doctor's Notes",
    icon: "note",
  },
]

// Dummy symptoms data for dropdown
const availableSymptoms = [
  { id: 1, name: "Fever" },
  { id: 2, name: "Cough" },
  { id: 3, name: "Headache" },
  { id: 4, name: "Fatigue" },
  { id: 5, name: "Nausea" },
  { id: 6, name: "Dizziness" },
  { id: 7, name: "Shortness of breath" },
  { id: 8, name: "Chest pain" },
  { id: 9, name: "Sore throat" },
  { id: 10, name: "Body aches" },
  { id: 11, name: "Loss of taste/smell" },
  { id: 12, name: "Runny nose" },
  { id: 13, name: "Muscle pain" },
  { id: 14, name: "Joint pain" },
  { id: 15, name: "Rash" },
  { id: 16, name: "Vomiting" },
  { id: 17, name: "Diarrhea" },
  { id: 18, name: "Abdominal pain" },
]

// Gender options matching the interface
const genderOptions = ["MALE", "FEMALE", "OTHER"]

export default function RegisterPatient() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PatientCreateRequest>({
    personal_details: {
      email: "",
      name: "",
      password: "",
      phoneNumber: "",
      adharCard: "",
      gender: undefined,
      age: undefined,
      address: "",
      pincode: undefined,
    },
    medical_history: {
      preExistingConditions: "",
      currentMedications: "",
    },
    symptoms_vitals: {
      appointmentDate: new Date(),
      symptoms: [],
      bloodPressure: "",
      temperature: "",
      sugarLevel: "",
      pulseRate: "",
    },
    doctor_notes: {
      diagnosis: "",
      treatmentAdvice: "",
      nextAppointmentDate: undefined,
    },
  })

  // Validation errors state
  const [errors, setErrors] = useState<{
    personal_details?: {
      name?: string
      email?: string
      password?: string
      phoneNumber?: string
      adharCard?: string
      gender?: string
      age?: string
      pincode?: string
    }
    symptoms_vitals?: {
      appointmentDate?: string
    }
  }>({})

  const [showSymptomDropdown, setShowSymptomDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)

  // Date picker states
  const [showAppointmentDatePicker, setShowAppointmentDatePicker] = useState(false)
  const [showAppointmentTimePicker, setShowAppointmentTimePicker] = useState(false)
  const [showNextAppointmentDatePicker, setShowNextAppointmentDatePicker] = useState(false)
  const [showNextAppointmentTimePicker, setShowNextAppointmentTimePicker] = useState(false)
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date")

  // Web date/time input values
  const [webAppointmentDateValue, setWebAppointmentDateValue] = useState(
    `${formData.symptoms_vitals.appointmentDate.getFullYear()}-${String(formData.symptoms_vitals.appointmentDate.getMonth() + 1).padStart(2, "0")}-${String(formData.symptoms_vitals.appointmentDate.getDate()).padStart(2, "0")}`,
  )
  const [webAppointmentTimeValue, setWebAppointmentTimeValue] = useState(
    `${String(formData.symptoms_vitals.appointmentDate.getHours()).padStart(2, "0")}:${String(formData.symptoms_vitals.appointmentDate.getMinutes()).padStart(2, "0")}`,
  )
  const [webNextAppointmentDateValue, setWebNextAppointmentDateValue] = useState("")
  const [webNextAppointmentTimeValue, setWebNextAppointmentTimeValue] = useState("")

  const scrollViewRef = useRef<ScrollView>(null)

  const [attachment, setAttachment] = useState<any | null>(null)

  // Determine if we're on web platform
  const isWeb = Platform.OS === "web"

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      console.log("Document picked:", result.assets);
      if (!result.canceled && result.assets) {
        setAttachment({ files: result.assets });
      }
    } catch (err) {
      console.log('Document picking error:', err);
    }
  };
  

  // Web date change handlers
  const handleWebAppointmentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setWebAppointmentDateValue(dateValue)

    if (dateValue) {
      const newDate = new Date(dateValue)
      // Preserve the time from the existing date
      newDate.setHours(
        formData.symptoms_vitals.appointmentDate.getHours(),
        formData.symptoms_vitals.appointmentDate.getMinutes(),
      )

      setFormData({
        ...formData,
        symptoms_vitals: {
          ...formData.symptoms_vitals,
          appointmentDate: newDate,
        },
      })

      // Clear any appointment date errors
      if (errors.symptoms_vitals?.appointmentDate) {
        setErrors((prev) => ({
          ...prev,
          symptoms_vitals: {
            ...prev.symptoms_vitals,
            appointmentDate: undefined,
          },
        }))
      }
    }
  }

  const handleWebAppointmentTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setWebAppointmentTimeValue(timeValue)

    if (timeValue) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newDate = new Date(formData.symptoms_vitals.appointmentDate)
      newDate.setHours(hours, minutes)

      setFormData({
        ...formData,
        symptoms_vitals: {
          ...formData.symptoms_vitals,
          appointmentDate: newDate,
        },
      })
    }
  }

  const handleWebNextAppointmentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setWebNextAppointmentDateValue(dateValue)

    if (dateValue) {
      let newDate: Date

      if (formData.doctor_notes?.nextAppointmentDate) {
        newDate = new Date(formData.doctor_notes.nextAppointmentDate)
        newDate.setFullYear(
          Number.parseInt(dateValue.split("-")[0]),
          Number.parseInt(dateValue.split("-")[1]) - 1,
          Number.parseInt(dateValue.split("-")[2]),
        )
      } else {
        newDate = new Date(dateValue)
        // Set default time to current time
        const now = new Date()
        newDate.setHours(now.getHours(), now.getMinutes())
        setWebNextAppointmentTimeValue(
          `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        )
      }

      setFormData({
        ...formData,
        doctor_notes: {
          ...formData.doctor_notes!,
          nextAppointmentDate: newDate,
        },
      })
    }
  }

  const handleWebNextAppointmentTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setWebNextAppointmentTimeValue(timeValue)

    if (timeValue) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      let newDate: Date

      if (formData.doctor_notes?.nextAppointmentDate) {
        newDate = new Date(formData.doctor_notes.nextAppointmentDate)
      } else {
        // If no date was set, use today's date
        newDate = new Date()
        const dateString = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`
        setWebNextAppointmentDateValue(dateString)
      }

      newDate.setHours(hours, minutes)

      setFormData({
        ...formData,
        doctor_notes: {
          ...formData.doctor_notes!,
          nextAppointmentDate: newDate,
        },
      })
    }
  }

  // Validate current step
  const validateCurrentStep = async () => {
    try {
      switch (currentStep) {
        case 0: // Personal Details
          await personalDetailsSchema.validate(formData.personal_details, { abortEarly: false })
          setErrors((prev) => ({ ...prev, personal_details: {} }))
          return true
        case 1: // Medical History
          await medicalHistorySchema.validate(formData.medical_history, { abortEarly: false })
          return true
        case 2: // Symptoms & Vitals
          await symptomsVitalsSchema.validate(formData.symptoms_vitals, { abortEarly: false })
          setErrors((prev) => ({ ...prev, symptoms_vitals: {} }))
          return true
        case 3: // Doctor's Notes
          await doctorNotesSchema.validate(formData.doctor_notes, { abortEarly: false })
          return true
        default:
          return false
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const validationErrors: any = {}

        error.inner.forEach((err) => {
          if (err.path) {
            // Create nested structure based on the step
            if (currentStep === 0) {
              if (!validationErrors.personal_details) validationErrors.personal_details = {}
              validationErrors.personal_details[err.path] = err.message
            } else if (currentStep === 2) {
              if (!validationErrors.symptoms_vitals) validationErrors.symptoms_vitals = {}
              validationErrors.symptoms_vitals[err.path] = err.message
            }
          }
        })

        setErrors((prev) => ({ ...prev, ...validationErrors }))
      }
      return false
    }
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()

    if (!isValid) {
      // Scroll to top to show errors
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true })
      }
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      // Scroll to top when changing steps
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true })
      }
    } else {
      setIsLoading(true)
      console.log("Form submitted:", formData)
      try {
        const res = await createPatient(formData)
        if (res.success) {
          const uploadRes = await handleUpload(res.data.patientId);
          if(uploadRes.success){
            showToast("success", "Registration successfull")
          }else{
            //rollback delete goes here

            showToast("error",  res.message??"Document upload failed")
          }
        } else {
          showToast("error", res.message ?? "Registration failed")
        }
      } catch (e) {
        showToast("error", "An error occurred. Please try again.")
        console.log("Registration error:", e)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true })
      }
    }
  }

  const toggleSymptom = (symptomName: string) => {
    setFormData((prevData) => {
      const currentSymptoms = prevData.symptoms_vitals?.symptoms || []
      let newSymptoms: string[]

      if (currentSymptoms.includes(symptomName)) {
        newSymptoms = currentSymptoms.filter((s) => s !== symptomName)
      } else {
        newSymptoms = [...currentSymptoms, symptomName]
      }

      return {
        ...prevData,
        symptoms_vitals: {
          ...prevData.symptoms_vitals!,
          symptoms: newSymptoms,
        },
      }
    })
  }

  const getSelectedSymptomsText = () => {
    const symptoms = formData.symptoms_vitals?.symptoms || []
    if (symptoms.length === 0) return "Select symptoms"
    return symptoms.join(", ")
  }

  const formatDate = (date?: Date) => {
    if (!date) return "Select date"

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const formatTime = (date?: Date) => {
    if (!date) return "Select time"

    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"

    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`
  }

  const formatDateTime = (date?: Date) => {
    if (!date) return "Select date & time"
    return `${formatDate(date)} ${formatTime(date)}`
  }

  // Handle date change from DateTimePicker
  const onAppointmentDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.symptoms_vitals?.appointmentDate

    // Hide the picker on iOS as it doesn't dismiss automatically
    if (Platform.OS === "ios") {
      setShowAppointmentDatePicker(false)
      setShowAppointmentTimePicker(false)
    } else {
      if (datePickerMode === "date") {
        setShowAppointmentDatePicker(false)
        // On Android, after selecting date, show time picker
        setDatePickerMode("time")
        setShowAppointmentTimePicker(true)
      } else {
        setShowAppointmentTimePicker(false)
      }
    }

    if (selectedDate) {
      // If we're in time mode, preserve the date but update the time
      if (datePickerMode === "time" && formData.symptoms_vitals?.appointmentDate) {
        const prevDate = new Date(formData.symptoms_vitals.appointmentDate)
        prevDate.setHours(selectedDate.getHours())
        prevDate.setMinutes(selectedDate.getMinutes())

        setFormData({
          ...formData,
          symptoms_vitals: {
            ...formData.symptoms_vitals!,
            appointmentDate: prevDate,
          },
        })
      } else {
        // If we're in date mode, update the date but preserve the time if it exists
        const newDate = new Date(selectedDate)
        if (formData.symptoms_vitals?.appointmentDate) {
          const prevTime = formData.symptoms_vitals.appointmentDate
          newDate.setHours(prevTime.getHours())
          newDate.setMinutes(prevTime.getMinutes())
        }

        setFormData({
          ...formData,
          symptoms_vitals: {
            ...formData.symptoms_vitals!,
            appointmentDate: newDate,
          },
        })
      }
    }

    // Clear any appointment date errors
    if (errors.symptoms_vitals?.appointmentDate) {
      setErrors((prev) => ({
        ...prev,
        symptoms_vitals: {
          ...prev.symptoms_vitals,
          appointmentDate: undefined,
        },
      }))
    }
  }

  // Handle date change for next appointment
  const onNextAppointmentDateChange = (event: any, selectedDate?: Date) => {
    // Hide the picker on iOS as it doesn't dismiss automatically
    if (Platform.OS === "ios") {
      setShowNextAppointmentDatePicker(false)
      setShowNextAppointmentTimePicker(false)
    } else {
      if (datePickerMode === "date") {
        setShowNextAppointmentDatePicker(false)
        // On Android, after selecting date, show time picker
        setDatePickerMode("time")
        setShowNextAppointmentTimePicker(true)
      } else {
        setShowNextAppointmentTimePicker(false)
      }
    }

    if (selectedDate) {
      // If we're in time mode, preserve the date but update the time
      if (datePickerMode === "time" && formData.doctor_notes?.nextAppointmentDate) {
        const prevDate = new Date(formData.doctor_notes.nextAppointmentDate)
        prevDate.setHours(selectedDate.getHours())
        prevDate.setMinutes(selectedDate.getMinutes())

        setFormData({
          ...formData,
          doctor_notes: {
            ...formData.doctor_notes!,
            nextAppointmentDate: prevDate,
          },
        })
      } else {
        // If we're in date mode, update the date but preserve the time if it exists
        const newDate = new Date(selectedDate)
        if (formData.doctor_notes?.nextAppointmentDate) {
          const prevTime = formData.doctor_notes.nextAppointmentDate
          newDate.setHours(prevTime.getHours())
          newDate.setMinutes(prevTime.getMinutes())
        }

        setFormData({
          ...formData,
          doctor_notes: {
            ...formData.doctor_notes!,
            nextAppointmentDate: newDate,
          },
        })
      }
    }
  }

  // Show date picker based on platform
  const showDatePicker = (type: "appointment" | "nextAppointment") => {
    setDatePickerMode("date")

    if (type === "appointment") {
      if (Platform.OS === "ios") {
        // On iOS, show modal with both date and time pickers
        setShowAppointmentDatePicker(true)
      } else {
        // On Android, show date picker first
        setShowAppointmentDatePicker(true)
      }
    } else {
      if (Platform.OS === "ios") {
        // On iOS, show modal with both date and time pickers
        setShowNextAppointmentDatePicker(true)
      } else {
        // On Android, show date picker first
        setShowNextAppointmentDatePicker(true)
      }
    }
  }

  // Show time picker (iOS only, Android handles this in the date change callback)
  const showTimePicker = (type: "appointment" | "nextAppointment") => {
    setDatePickerMode("time")

    if (type === "appointment") {
      setShowAppointmentTimePicker(true)
    } else {
      setShowNextAppointmentTimePicker(true)
    }
  }

  const handleUpload=async(id:string)=>{
      const res = await uploadDocument(id,attachment);
      return res;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Details
        return (
          <View style={styles.stepContent}>
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={[styles.input, errors.personal_details?.name && styles.inputError]}
                  placeholderTextColor={"#9e9e9e"}
                  placeholder="Full Name"
                  value={formData.personal_details.name}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        name: text,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.name) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          name: undefined,
                        },
                      }))
                    }
                  }}
                />
                {errors.personal_details?.name && <Text style={styles.errorText}>{errors.personal_details.name}</Text>}
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, errors.personal_details?.email && styles.inputError]}
                  placeholderTextColor={"#9e9e9e"}
                  placeholder="Email Address"
                  value={formData.personal_details.email}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        email: text,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.email) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          email: undefined,
                        },
                      }))
                    }
                  }}
                  keyboardType="email-address"
                />
                {errors.personal_details?.email && (
                  <Text style={styles.errorText}>{errors.personal_details.email}</Text>
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={[styles.input, errors.personal_details?.password && styles.inputError]}
                  placeholderTextColor={"#9e9e9e"}
                  placeholder="Password"
                  value={formData.personal_details.password}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        password: text,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.password) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          password: undefined,
                        },
                      }))
                    }
                  }}
                  secureTextEntry
                />
                {errors.personal_details?.password && (
                  <Text style={styles.errorText}>{errors.personal_details.password}</Text>
                )}
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.personal_details?.phoneNumber && styles.inputError]}
                  placeholder="Phone Number"
                  placeholderTextColor={"#9e9e9e"}
                  value={formData.personal_details.phoneNumber}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        phoneNumber: text,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.phoneNumber) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          phoneNumber: undefined,
                        },
                      }))
                    }
                  }}
                  keyboardType="phone-pad"
                />
                {errors.personal_details?.phoneNumber && (
                  <Text style={styles.errorText}>{errors.personal_details.phoneNumber}</Text>
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Gender</Text>
                <TouchableOpacity
                  style={[styles.selectInput, errors.personal_details?.gender && styles.inputError]}
                  onPress={() => setShowGenderDropdown(true)}
                >
                  <Text style={formData.personal_details.gender ? styles.selectText : styles.placeholderText}>
                    {formData.personal_details.gender || "Gender"}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#757575" />
                </TouchableOpacity>
                {errors.personal_details?.gender && (
                  <Text style={styles.errorText}>{errors.personal_details.gender}</Text>
                )}
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  placeholderTextColor={"#9e9e9e"}
                  style={[styles.input, errors.personal_details?.age && styles.inputError]}
                  placeholder="Age"
                  value={formData.personal_details.age?.toString() || ""}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        age: text ? Number.parseInt(text) : undefined,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.age) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          age: undefined,
                        },
                      }))
                    }
                  }}
                  keyboardType="numeric"
                />
                {errors.personal_details?.age && <Text style={styles.errorText}>{errors.personal_details.age}</Text>}
              </View>
            </View>

            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                placeholderTextColor={"#9e9e9e"}
                style={[styles.input, { height: 80 }]}
                placeholder="Address"
                value={formData.personal_details.address}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      address: text,
                    },
                  })
                }
                multiline
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Aadhar Card No</Text>
                <TextInput
                  style={[styles.input, errors.personal_details?.adharCard && styles.inputError]}
                  placeholderTextColor={"#9e9e9e"}
                  placeholder="Aadhar Card No"
                  value={formData.personal_details.adharCard}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        adharCard: text,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.adharCard) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          adharCard: undefined,
                        },
                      }))
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={12}
                />
                {errors.personal_details?.adharCard && (
                  <Text style={styles.errorText}>{errors.personal_details.adharCard}</Text>
                )}
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={[styles.input, errors.personal_details?.pincode && styles.inputError]}
                  placeholderTextColor={"#9e9e9e"}
                  placeholder="Pincode"
                  value={formData.personal_details.pincode?.toString() || ""}
                  onChangeText={(text) => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        pincode: text ? Number.parseInt(text) : undefined,
                      },
                    })
                    // Clear error when typing
                    if (errors.personal_details?.pincode) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          pincode: undefined,
                        },
                      }))
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.personal_details?.pincode && (
                  <Text style={styles.errorText}>{errors.personal_details.pincode}</Text>
                )}
              </View>
            </View>
          </View>
        )

      case 1: // Medical History
        return (
          <View style={styles.stepContent}>
            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Pre-existing Conditions</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholderTextColor={"#9e9e9e"}
                placeholder="Enter pre-existing conditions"
                value={formData.medical_history?.preExistingConditions}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    medical_history: {
                      ...formData.medical_history!,
                      preExistingConditions: text,
                    },
                  })
                }
                multiline
              />
            </View>

            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Current Medications</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholderTextColor={"#9e9e9e"}
                placeholder="Enter current medications"
                value={formData.medical_history?.currentMedications}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    medical_history: {
                      ...formData.medical_history!,
                      currentMedications: text,
                    },
                  })
                }
                multiline
              />
            </View>
          </View>
        )

      case 2: // Symptoms & Vitals
        return (
          <View style={styles.stepContent}>
            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Appointment Date & Time</Text>
              {isWeb ? (
                <View style={styles.webDateTimeContainer}>
                  <Text style={styles.selectText}>{formatDateTime(formData.symptoms_vitals?.appointmentDate)}</Text>
                  <View style={styles.webInputsRow}>
                    <View style={styles.webInputContainer}>
                      <Text style={styles.webInputLabel}>Date:</Text>
                      <input
                        type="date"
                        value={webAppointmentDateValue}
                        onChange={handleWebAppointmentDateChange}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #e0e0e0",
                          width: "100%",
                        }}
                      />
                    </View>
                    <View style={styles.webInputContainer}>
                      <Text style={styles.webInputLabel}>Time:</Text>
                      <input
                        type="time"
                        value={webAppointmentTimeValue}
                        onChange={handleWebAppointmentTimeChange}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #e0e0e0",
                          width: "100%",
                        }}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.selectInput, errors.symptoms_vitals?.appointmentDate && styles.inputError]}
                  onPress={() => showDatePicker("appointment")}
                >
                  <Text style={styles.selectText}>{formatDateTime(formData.symptoms_vitals?.appointmentDate)}</Text>
                  <MaterialIcons name="calendar-today" size={20} color="#757575" />
                </TouchableOpacity>
              )}
              {errors.symptoms_vitals?.appointmentDate && (
                <Text style={styles.errorText}>{errors.symptoms_vitals.appointmentDate}</Text>
              )}
            </View>

            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Symptoms</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowSymptomDropdown(true)}>
                <Text
                  style={
                    (formData.symptoms_vitals?.symptoms?.length || 0) > 0 ? styles.selectText : styles.placeholderText
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getSelectedSymptomsText()}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Blood Pressure (mmHg)</Text>
                <TextInput
                  placeholderTextColor={"#9e9e9e"}
                  style={styles.input}
                  placeholder="e.g., 120/80"
                  value={formData.symptoms_vitals?.bloodPressure}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      symptoms_vitals: {
                        ...formData.symptoms_vitals!,
                        bloodPressure: text,
                      },
                    })
                  }
                />
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Sugar Level (mg/dL)</Text>
                <TextInput
                  placeholderTextColor={"#9e9e9e"}
                  style={styles.input}
                  placeholder="e.g., 100"
                  value={formData.symptoms_vitals?.sugarLevel}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      symptoms_vitals: {
                        ...formData.symptoms_vitals!,
                        sugarLevel: text,
                      },
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Temperature (°F)</Text>
                <TextInput
                  placeholderTextColor={"#9e9e9e"}
                  style={styles.input}
                  placeholder="e.g., 98.6"
                  value={formData.symptoms_vitals?.temperature}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      symptoms_vitals: {
                        ...formData.symptoms_vitals!,
                        temperature: text,
                      },
                    })
                  }
                />
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.inputLabel}>Pulse Rate (bpm)</Text>
                <TextInput
                  placeholderTextColor={"#9e9e9e"}
                  style={styles.input}
                  placeholder="e.g., 72"
                  value={formData.symptoms_vitals?.pulseRate}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      symptoms_vitals: {
                        ...formData.symptoms_vitals!,
                        pulseRate: text,
                      },
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Attachment</Text>
              <View style={styles.attachmentContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                  <MaterialIcons name="file-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload File</Text>
                </TouchableOpacity>
                {attachment && attachment.files.length > 0 && (
                  <>
                    {attachment.files.map((file:any, index:number) => (
                      <View key={index} style={styles.filePreview}>
                        <MaterialIcons name="insert-drive-file" size={20} color="#2196F3" />
                        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                          {file.name}
                        </Text>
                        <TouchableOpacity onPress={() => {
                          const updatedFiles = attachment.files.filter((_:any, i:number) => i !== index);
                          if (updatedFiles.length === 0) {
                            setAttachment(null);
                          } else {
                            setAttachment({ files: updatedFiles });
                          }
                        }}>
                          <MaterialIcons name="close" size={20} color="#f44336" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </View>
          </View>
        )

      case 3: // Doctor's Notes
        return (
          <View style={styles.stepContent}>
            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Diagnosis</Text>
              <TextInput
                placeholderTextColor={"#9e9e9e"}
                style={[styles.input, { height: 80 }]}
                placeholder="Enter diagnosis"
                value={formData.doctor_notes?.diagnosis}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    doctor_notes: {
                      ...formData.doctor_notes!,
                      diagnosis: text,
                    },
                  })
                }
                multiline
              />
            </View>

            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Treatment Advice</Text>
              <TextInput
                placeholderTextColor={"#9e9e9e"}
                style={[styles.input, { height: 80 }]}
                placeholder="Enter treatment advice"
                value={formData.doctor_notes?.treatmentAdvice}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    doctor_notes: {
                      ...formData.doctor_notes!,
                      treatmentAdvice: text,
                    },
                  })
                }
                multiline
              />
            </View>

            <View style={styles.formFullRow}>
              <Text style={styles.inputLabel}>Next Appointment Date & Time</Text>
              {isWeb ? (
                <View style={styles.webDateTimeContainer}>
                  <Text style={formData.doctor_notes?.nextAppointmentDate ? styles.selectText : styles.placeholderText}>
                    {formData.doctor_notes?.nextAppointmentDate
                      ? formatDateTime(formData.doctor_notes.nextAppointmentDate)
                      : "Select date & time"}
                  </Text>
                  <View style={styles.webInputsRow}>
                    <View style={styles.webInputContainer}>
                      <Text style={styles.webInputLabel}>Date:</Text>
                      <input
                        type="date"
                        value={webNextAppointmentDateValue}
                        onChange={handleWebNextAppointmentDateChange}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #e0e0e0",
                          width: "100%",
                        }}
                      />
                    </View>
                    <View style={styles.webInputContainer}>
                      <Text style={styles.webInputLabel}>Time:</Text>
                      <input
                        type="time"
                        value={webNextAppointmentTimeValue}
                        onChange={handleWebNextAppointmentTimeChange}
                        style={{
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #e0e0e0",
                          width: "100%",
                        }}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.selectInput} onPress={() => showDatePicker("nextAppointment")}>
                  <Text style={formData.doctor_notes?.nextAppointmentDate ? styles.selectText : styles.placeholderText}>
                    {formData.doctor_notes?.nextAppointmentDate
                      ? formatDateTime(formData.doctor_notes.nextAppointmentDate)
                      : "Select date & time"}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#757575" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepWrapper}>
            <View
              style={[
                styles.step,
                index <= currentStep && styles.stepActive,
                index < currentStep && styles.stepCompleted,
              ]}
            >
              <MaterialIcons name={step.icon as any} size={20} color={index <= currentStep ? "#fff" : "#999"} />
            </View>
            <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>{step.label}</Text>
            {index < steps.length - 1 && (
              <View style={[styles.connector, index < currentStep && styles.connectorActive]} />
            )}
          </View>
        ))}
      </View>

      {/* Form Content */}
      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContentContainer} ref={scrollViewRef}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.button, styles.backButton, currentStep === 0 && styles.disabledButton]}
          onPress={handleBack}
          disabled={currentStep === 0}
        >
          <Text style={[styles.backButtonText, currentStep === 0 && styles.disabledButtonText]}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.nextButton, isLoading && styles.disabledNextButton]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.nextButtonText}>{currentStep === steps.length - 1 ? "SUBMIT" : "NEXT"}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Gender Dropdown Modal */}
      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderDropdown(false)}>
          <View style={[styles.modalContainer, { maxHeight: "auto" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownList}>
              {genderOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    formData.personal_details.gender === option && styles.dropdownItemSelected,
                    index === genderOptions.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      personal_details: {
                        ...formData.personal_details,
                        gender: option as "MALE" | "FEMALE" | "OTHER",
                      },
                    })
                    // Clear gender error if exists
                    if (errors.personal_details?.gender) {
                      setErrors((prev) => ({
                        ...prev,
                        personal_details: {
                          ...prev.personal_details,
                          gender: undefined,
                        },
                      }))
                    }
                    setShowGenderDropdown(false)
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      formData.personal_details.gender === option && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Symptoms Modal */}
      <Modal
        visible={showSymptomDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSymptomDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSymptomDropdown(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Symptoms</Text>
              <TouchableOpacity onPress={() => setShowSymptomDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {availableSymptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={styles.symptomItem}
                  onPress={() => toggleSymptom(symptom.name)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      formData.symptoms_vitals?.symptoms?.includes(symptom.name) && styles.checkboxSelected,
                    ]}
                  >
                    {formData.symptoms_vitals?.symptoms?.includes(symptom.name) && (
                      <MaterialIcons name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.symptomText}>{symptom.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowSymptomDropdown(false)}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* DateTimePicker for iOS */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showAppointmentDatePicker || showAppointmentTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowAppointmentDatePicker(false)
            setShowAppointmentTimePicker(false)
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setShowAppointmentDatePicker(false)
              setShowAppointmentTimePicker(false)
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date & Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAppointmentDatePicker(false)
                    setShowAppointmentTimePicker(false)
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimePickerContainer}>
                <View style={styles.dateTimePickerTabs}>
                  <TouchableOpacity
                    style={[styles.dateTimePickerTab, datePickerMode === "date" && styles.dateTimePickerTabActive]}
                    onPress={() => setDatePickerMode("date")}
                  >
                    <Text
                      style={[
                        styles.dateTimePickerTabText,
                        datePickerMode === "date" && styles.dateTimePickerTabTextActive,
                      ]}
                    >
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimePickerTab, datePickerMode === "time" && styles.dateTimePickerTabActive]}
                    onPress={() => setDatePickerMode("time")}
                  >
                    <Text
                      style={[
                        styles.dateTimePickerTabText,
                        datePickerMode === "time" && styles.dateTimePickerTabTextActive,
                      ]}
                    >
                      Time
                    </Text>
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={formData.symptoms_vitals?.appointmentDate || new Date()}
                  mode={datePickerMode}
                  display="spinner"
                  onChange={onAppointmentDateChange}
                  style={styles.dateTimePicker}
                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowAppointmentDatePicker(false)
                      setShowAppointmentTimePicker(false)
                    }}
                  >
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* DateTimePicker for Next Appointment (iOS) */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showNextAppointmentDatePicker || showNextAppointmentTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowNextAppointmentDatePicker(false)
            setShowNextAppointmentTimePicker(false)
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setShowNextAppointmentDatePicker(false)
              setShowNextAppointmentTimePicker(false)
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date & Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowNextAppointmentDatePicker(false)
                    setShowNextAppointmentTimePicker(false)
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimePickerContainer}>
                <View style={styles.dateTimePickerTabs}>
                  <TouchableOpacity
                    style={[styles.dateTimePickerTab, datePickerMode === "date" && styles.dateTimePickerTabActive]}
                    onPress={() => setDatePickerMode("date")}
                  >
                    <Text
                      style={[
                        styles.dateTimePickerTabText,
                        datePickerMode === "date" && styles.dateTimePickerTabTextActive,
                      ]}
                    >
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimePickerTab, datePickerMode === "time" && styles.dateTimePickerTabActive]}
                    onPress={() => setDatePickerMode("time")}
                  >
                    <Text
                      style={[
                        styles.dateTimePickerTabText,
                        datePickerMode === "time" && styles.dateTimePickerTabTextActive,
                      ]}
                    >
                      Time
                    </Text>
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={formData.doctor_notes?.nextAppointmentDate || new Date()}
                  mode={datePickerMode}
                  display="spinner"
                  onChange={onNextAppointmentDateChange}
                  style={styles.dateTimePicker}
                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowNextAppointmentDatePicker(false)
                      setShowNextAppointmentTimePicker(false)
                    }}
                  >
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* DateTimePicker for Android (rendered directly) */}
      {Platform.OS === "android" && showAppointmentDatePicker && (
        <DateTimePicker
          value={formData.symptoms_vitals?.appointmentDate || new Date()}
          mode="date"
          display="default"
          onChange={onAppointmentDateChange}
        />
      )}

      {Platform.OS === "android" && showAppointmentTimePicker && (
        <DateTimePicker
          value={formData.symptoms_vitals?.appointmentDate || new Date()}
          mode="time"
          display="default"
          onChange={onAppointmentDateChange}
        />
      )}

      {Platform.OS === "android" && showNextAppointmentDatePicker && (
        <DateTimePicker
          value={formData.doctor_notes?.nextAppointmentDate || new Date()}
          mode="date"
          display="default"
          onChange={onNextAppointmentDateChange}
        />
      )}

      {Platform.OS === "android" && showNextAppointmentTimePicker && (
        <DateTimePicker
          value={formData.doctor_notes?.nextAppointmentDate || new Date()}
          mode="time"
          display="default"
          onChange={onNextAppointmentDateChange}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
    marginBottom: 32,
  },
  stepWrapper: {
    alignItems: "center",
    paddingHorizontal: 5,
    flex: 1,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepActive: {
    backgroundColor: "#2196F3",
  },
  stepCompleted: {
    backgroundColor: "#4CAF50",
  },
  stepLabel: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  stepLabelActive: {
    color: "#333",
    fontWeight: "500",
  },
  connector: {
    position: "absolute",
    top: 20,
    right: -50,
    width: 100,
    height: 2,
    backgroundColor: "#eee",
    zIndex: -1,
  },
  connectorActive: {
    backgroundColor: "#4CAF50",
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    paddingBottom: 20,
  },
  stepContent: {
    gap: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
  },
  formFullRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  selectInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9e9e9e",
    flex: 1,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  nextButton: {
    backgroundColor: "#2196F3",
  },
  disabledButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
    opacity: 0.5,
  },
  disabledNextButton: {
    backgroundColor: "#2196F3",
    borderColor: "#e0e0e0",
    opacity: 0.5,
  },
  backButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  disabledButtonText: {
    color: "#9e9e9e",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  symptomItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  symptomText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2196F3",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: "#2196F3",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  // Dropdown styles
  dropdownList: {
    width: "100%",
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#e3f2fd",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#2196F3",
    fontWeight: "500",
  },
  // DateTimePicker styles
  dateTimePickerContainer: {
    padding: 16,
  },
  dateTimePickerTabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
  },
  dateTimePickerTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateTimePickerTabActive: {
    backgroundColor: "#e3f2fd",
  },
  dateTimePickerTabText: {
    fontSize: 16,
    color: "#757575",
  },
  dateTimePickerTabTextActive: {
    color: "#2196F3",
    fontWeight: "500",
  },
  dateTimePicker: {
    height: 200,
  },
  attachmentContainer: {
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    marginRight: 8,
  },
  // Web date/time input styles
  webDateTimeContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 12,
    backgroundColor: "#fff",
  },
  webInputsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  webInputContainer: {
    flex: 1,
  },
  webInputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
})


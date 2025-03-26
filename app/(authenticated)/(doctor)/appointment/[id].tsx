"use client"

import type React from "react"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useLocalSearchParams } from "expo-router"
import { createAppointment } from "@/api"
import { showToast } from "@/utils/toast"

interface AppointmentDetails {
  appointmentDate: Date
  appointmentTime: Date
  reason: string
  notes: string
}

const formatDate = (date: Date): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayName = days[date.getDay()]
  const monthName = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  return `${dayName}, ${monthName} ${day}, ${year}`
}

const formatTime = (date: Date): string => {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? "0" + minutes : minutes

  return `${hours}:${minutesStr} ${ampm}`
}

export default function AppointmentPage() {
  const now = new Date()
  const { id } = useLocalSearchParams()
  console.log("Patient ID:", id)
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails>({
    appointmentDate: now,
    appointmentTime: now,
    reason: "",
    notes: "",
  })

  // State for date/time picker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // State for loading
  const [isLoading, setIsLoading] = useState(false)

  // Web date/time input refs
  const [webDateInputValue, setWebDateInputValue] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  )
  const [webTimeInputValue, setWebTimeInputValue] = useState(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  )

  const handleScheduleAppointment = async () => {
    setIsLoading(true)
    try {
      const hours = appointmentDetails.appointmentTime.getHours().toString().padStart(2, "0")
      const minutes = appointmentDetails.appointmentTime.getMinutes().toString().padStart(2, "0")
      const formattedTime = `${hours}:${minutes}`

      const year = appointmentDetails.appointmentDate.getFullYear()
      const month = (appointmentDetails.appointmentDate.getMonth() + 1).toString().padStart(2, "0")
      const day = appointmentDetails.appointmentDate.getDate().toString().padStart(2, "0")
      const formattedDate = `${year}-${month}-${day}`

      const res = await createAppointment({
        patientId: id as string,
        appointmentDate: new Date(formattedDate),
        appointmentTime: formattedTime,
        reason: appointmentDetails.reason,
        notes: appointmentDetails.notes,
      })
      console.log("Appointment response:", res)
      if (res.success) {
        showToast("success", "Appointment scheduled successfully")
        handleCancel()
      } else {
        showToast("error", res.message ?? "Appointment scheduling failed")
      }
    } catch (e) {
      showToast("error", "An error occurred. Please try again.")
      console.log("Appointment error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    const now = new Date()
    setAppointmentDetails({
      appointmentDate: now,
      appointmentTime: now,
      reason: "",
      notes: "",
    })
    // Update web input values
    setWebDateInputValue(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    )
    setWebTimeInputValue(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
  }

  const handleUpdateField = (field: keyof AppointmentDetails, value: any) => {
    setAppointmentDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Hide the picker on iOS as it doesn't dismiss automatically
    if (Platform.OS === "ios") {
      setShowDatePicker(false)
    } else {
      setShowDatePicker(false)
    }

    if (selectedDate) {
      handleUpdateField("appointmentDate", selectedDate)
    }
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    // Hide the picker on iOS as it doesn't dismiss automatically
    if (Platform.OS === "ios") {
      setShowTimePicker(false)
    } else {
      setShowTimePicker(false)
    }

    if (selectedTime) {
      handleUpdateField("appointmentTime", selectedTime)
    }
  }

  // Web date change handler
  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setWebDateInputValue(dateValue)

    if (dateValue) {
      const newDate = new Date(dateValue)
      // Preserve the time from the existing date
      newDate.setHours(appointmentDetails.appointmentDate.getHours(), appointmentDetails.appointmentDate.getMinutes())
      handleUpdateField("appointmentDate", newDate)
    }
  }

  // Web time change handler
  const handleWebTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    setWebTimeInputValue(timeValue)

    if (timeValue) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newTime = new Date(appointmentDetails.appointmentTime)
      newTime.setHours(hours, minutes)
      handleUpdateField("appointmentTime", newTime)
    }
  }

  // Determine if we're on web platform
  const isWeb = Platform.OS === "web"

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Appointment</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.appointmentCard}>
          <Text style={styles.appointmentCardTitle}>Appointment Details</Text>

          {/* Appointment Date */}
          <View style={styles.appointmentField}>
            <View style={styles.appointmentFieldIcon}>
              <MaterialIcons name="event" size={24} color="#2196F3" />
            </View>
            <View style={styles.appointmentFieldContent}>
              <Text style={styles.appointmentFieldLabel}>
                Appointment Date <Text style={styles.requiredStar}>*</Text>
              </Text>

              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeDisplay}>{formatDate(appointmentDetails.appointmentDate)}</Text>

                {isWeb ? (
                  <input
                    type="date"
                    value={webDateInputValue}
                    onChange={handleWebDateChange}
                    min={new Date().toISOString().split("T")[0]}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      marginTop: "8px",
                      width: "100%",
                      maxWidth: "200px",
                    }}
                  />
                ) : (
                  <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                    <MaterialIcons name="calendar-today" size={18} color="#2196F3" />
                    <Text style={styles.dateTimeButtonText}>Change Date</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Date Picker for native platforms */}
              {!isWeb && showDatePicker && (
                <DateTimePicker
                  testID="datePicker"
                  value={appointmentDetails.appointmentDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </View>

          {/* Appointment Time */}
          <View style={styles.appointmentField}>
            <View style={styles.appointmentFieldIcon}>
              <MaterialIcons name="access-time" size={24} color="#2196F3" />
            </View>
            <View style={styles.appointmentFieldContent}>
              <Text style={styles.appointmentFieldLabel}>
                Appointment Time <Text style={styles.requiredStar}>*</Text>
              </Text>

              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeDisplay}>{formatTime(appointmentDetails.appointmentTime)}</Text>

                {isWeb ? (
                  <input
                    type="time"
                    value={webTimeInputValue}
                    onChange={handleWebTimeChange}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      marginTop: "8px",
                      width: "100%",
                      maxWidth: "200px",
                    }}
                  />
                ) : (
                  <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
                    <MaterialIcons name="access-time" size={18} color="#2196F3" />
                    <Text style={styles.dateTimeButtonText}>Change Time</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Time Picker for native platforms */}
              {!isWeb && showTimePicker && (
                <DateTimePicker
                  testID="timePicker"
                  value={appointmentDetails.appointmentTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}
            </View>
          </View>

          {/* Reason */}
          <View style={styles.appointmentField}>
            <View style={styles.appointmentFieldIcon}>
              <MaterialIcons name="medical-services" size={24} color="#2196F3" />
            </View>
            <View style={styles.appointmentFieldContent}>
              <Text style={styles.appointmentFieldLabel}>
                Reason <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.appointmentFieldInput}
                placeholderTextColor={"#9e9e9e"}
                value={appointmentDetails.reason}
                onChangeText={(text) => handleUpdateField("reason", text)}
                placeholder="e.g., Annual checkup, Follow-up, etc."
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.appointmentField}>
            <View style={styles.appointmentFieldIcon}>
              <MaterialIcons name="note" size={24} color="#2196F3" />
            </View>
            <View style={styles.appointmentFieldContent}>
              <Text style={styles.appointmentFieldLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholderTextColor={"#9e9e9e"}
                value={appointmentDetails.notes}
                onChangeText={(text) => handleUpdateField("notes", text)}
                multiline
                numberOfLines={4}
                placeholder="Enter any additional notes about the appointment"
              />
            </View>
          </View>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <MaterialIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleAppointment} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.actionButtonText}> Schedule Appointment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  appointmentField: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  appointmentFieldIcon: {
    width: 40,
    alignItems: "center",
    marginTop: 4,
  },
  appointmentFieldContent: {
    flex: 1,
  },
  appointmentFieldLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  requiredStar: {
    color: "#F44336",
    fontWeight: "bold",
  },
  appointmentFieldValue: {
    fontSize: 16,
    color: "#333",
  },
  appointmentFieldInput: {
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  dateTimeContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
    padding: 12,
  },
  dateTimeDisplay: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e1f0ff",
    alignSelf: "flex-start",
  },
  dateTimeButtonText: {
    color: "#2196F3",
    marginLeft: 4,
    fontSize: 14,
  },
  notesInput: {
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 100,
    textAlignVertical: "top",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  scheduleButton: {
    flex: 2,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F44336",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
})


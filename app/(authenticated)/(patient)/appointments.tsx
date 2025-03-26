"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { showToast } from "@/utils/toast"
import { cancelAppointment, getMyAppointments } from "@/api"


type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED"


type Appointment = {
  id: string
  doctorName: string
  department?: string
  appointmentDate: string
  appointmentTime: string
  status: AppointmentStatus
  notes?: string
  location?: string
  reason?: string
  doctorId?: string
}

export default function MyAppointments() {
  const [activeFilter, setActiveFilter] = useState<AppointmentStatus>("SCHEDULED")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isWeb = Platform.OS === "web"

  useEffect(() => {
    fetchAppointments()
  }, [activeFilter])

  const fetchAppointments = async () => {
    try {
    setLoading(true)
    const res = await getMyAppointments(activeFilter);
    if (res.success) {
      setAppointments(res.data.appointments)
      setError(null)
    } else {
      setError(res.message ?? "Failed to fetch profile data") 
      showToast("error", res.message??"Failed to fetch profile data")
    }
  } catch (err) {
    setError("Failed to fetch profile data")
    showToast("error","Failed to fetch profile data")
    console.log("Error fetching patient profile:", err)
  } finally {
    setLoading(false)
  }
  }

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get status color based on appointment status
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "SCHEDULED":
        return "#2196F3" // Blue
      case "COMPLETED":
        return "#4CAF50" // Green
      case "CANCELLED":
        return "#F44336" // Red
      default:
        return "#757575" // Grey
    }
  }


  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case "SCHEDULED":
        return "Scheduled"
      case "COMPLETED":
        return "Completed"
      case "CANCELLED":
        return "Cancelled"
      default:
        return status
    }
  }



  const handleCancelAppointment = async (appointmentId: string) => {
    try{
      const res = await cancelAppointment(appointmentId)
      if(res.success){
        showToast("success","Appointment Cancelled")
        fetchAppointments();
      }else{
        showToast("error",res.message??"Failed to cancel appointment")
      }
    }
    catch(e){
      console.log("Login Error:",e)
      showToast("error","Failed to cancel appointment")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "SCHEDULED" && styles.activeFilterTab]}
          onPress={() => setActiveFilter("SCHEDULED")}
        >
          <Text style={[styles.filterText, activeFilter === "SCHEDULED" && styles.activeFilterText]}>Scheduled</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "COMPLETED" && styles.activeFilterTab]}
          onPress={() => setActiveFilter("COMPLETED")}
        >
          <Text style={[styles.filterText, activeFilter === "COMPLETED" && styles.activeFilterText]}>Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "CANCELLED" && styles.activeFilterTab]}
          onPress={() => setActiveFilter("CANCELLED")}
        >
          <Text style={[styles.filterText, activeFilter === "CANCELLED" && styles.activeFilterText]}>Canceled</Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={64} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAppointments}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitial}>{appointment.doctorName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                    {getStatusText(appointment.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="event" size={16} color="#2196F3" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(appointment.appointmentDate)}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="access-time" size={16} color="#2196F3" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>{appointment.appointmentTime}</Text>
                  </View>
                </View>

                {appointment.location && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="location-on" size={16} color="#2196F3" style={styles.detailIcon} />
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>{appointment.location}</Text>
                    </View>
                  </View>
                )}

                {(appointment.notes || appointment.reason) && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{appointment.notes || appointment.reason}</Text>
                  </View>
                )}
              </View>

              {appointment.status === "SCHEDULED" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={()=>handleCancelAppointment(appointment.id)}>
                    <MaterialIcons name="close" size={16} color="#F44336" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={64} color="#BDBDBD" />
            <Text style={styles.emptyStateText}>
              No {getStatusText(activeFilter as AppointmentStatus).toLowerCase()} appointments found
            </Text>
          </View>
        )}
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
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeFilterTab: {
    borderBottomColor: "#2196F3",
  },
  filterText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#2196F3",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  doctorInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  departmentName: {
    fontSize: 12,
    color: "#757575",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  appointmentDetails: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    marginRight: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#757575",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    marginLeft: 6,
    color: "#F44336",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2196F3",
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
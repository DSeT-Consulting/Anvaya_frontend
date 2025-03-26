"use client"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { deleteDocument, getMyProfile, uploadDocument } from "@/api"
import { showToast } from "@/utils/toast"
import { Loader } from "@/components/loader"
import * as DocumentPicker from "expo-document-picker"

// Define types based on your API response
interface PatientProfile {
  personalInfo: {
    id: string
    uniqueId: string
    age: number
    gender: string
    address: string
    pincode: string
    userName: string
    email: string
    phoneNumber: string
    createdAt: string
    updatedAt: string
  }
  medicalHistory: {
    id: string
    patientId: string
    preExistingConditions: string
    currentMedications: string
    createdAt: string
    updatedAt: string
  } | null
  symptomsVitals: Array<{
    id: string
    patientId: string
    docterId: string
    appointmentDate: string
    symptoms: string[]
    bloodPressure: string
    temperature: string
    sugarLevel: string
    pulseRate: string
    docs : string[]
    createdAt: string
    updatedAt: string
  }>
  doctorNotes: Array<{
    id: string
    diagnosis: string
    treatmentAdvice: string
    nextAppointmentDate: string
    createdAt: string
    doctorName: string
  }>
  appointments: Array<{
    id: string
    appointmentDate: string
    appointmentTime: string
    reason: string
    status: string
    notes: string
    doctorName: string
  }>
}

export default function PatientProfile() {
  const [Loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patientData, setPatientData] = useState<PatientProfile | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [attachment,setAttachment] = useState<any | null>(null)
  const isWeb = Platform.OS === "web"

  useEffect(() => {
    fetchPatientProfile()
  }, [])

  const fetchPatientProfile = async () => {
    try {
      setLoading(true)
      const res = await getMyProfile();
      console.log("Profile Data:", res.data.doctorNotes)
      if (res.success) {
        showToast("success", "Fetched profile data successfully")
        console.log("Profile Data:", res.data.symptomsVitals)
        setPatientData(res.data)
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

  const handleDelDocument = async (docUrl: string) => {
    try {
      const url = encodeURIComponent(docUrl);
      const res = await deleteDocument(patientData?.medicalHistory?.patientId as string,url);
      if (res.success) {
        await fetchPatientProfile()
        showToast("success", "Document deleted successfully")
      } else {
        showToast("error", res.message ?? "Failed to delete document")
      }
    } catch (err) {
      showToast("error", "Failed to delete document")
      console.log("Error deleting document:", err)
    }
  }

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
  


  const handleUploadDocument=async()=>{
    try{
    setIsUploading(true)
    const res = await uploadDocument(patientData?.medicalHistory?.patientId as string,attachment);
    if (res.success) {
      showToast("success", "Document uploaded successfully")
      await fetchPatientProfile()
      setAttachment(null);
    } else {
      showToast("error", res.message ?? "Failed to upload document")
    }
   } catch (err) {
    showToast("error", "Failed to upload document")
    console.log("Error uploading document:", err)
  }
  finally{
    setIsUploading(false)
  }
  }


  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPatientProfile()
    setRefreshing(false)
  }


  if (Loading) {
    return (
      <Loader/>
    )
  }

  if (error || !patientData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>Failed to load patient data</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPatientProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // Get the latest symptoms/vitals if available
  const latestVitals = patientData.symptomsVitals.length > 0 ? patientData.symptomsVitals[0] : null
  // Get the latest doctor note if available
  const latestDoctorNote = patientData.doctorNotes.length > 0 ? patientData.doctorNotes[0] : null

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <MaterialIcons name="edit" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
            title="Refreshing..."
            titleColor="#666"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{patientData.personalInfo.userName.charAt(0)}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{patientData.personalInfo.userName}</Text>
            <Text style={styles.profileId}>ID: {patientData.personalInfo.uniqueId}</Text>
            <View style={styles.profileBadge}>
              <MaterialIcons name="verified-user" size={16} color="#4CAF50" />
              <Text style={styles.profileBadgeText}>Active Patient</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Personal Details</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.userName}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.age}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.gender}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Contact Number</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.phoneNumber}</Text>
            </View>

            <View style={[styles.detailItem, styles.fullWidth]}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.address}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.email}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Unique ID</Text>
              <Text style={styles.detailValue}>{patientData.personalInfo.uniqueId}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Registration Date</Text>
              <Text style={styles.detailValue}>
                {new Date(patientData.personalInfo.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Medical History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Medical History</Text>
          </View>

          {patientData.medicalHistory ? (
            <View style={styles.detailsGrid}>
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Pre-existing Conditions</Text>
                <Text style={styles.detailValue}>
                  {patientData.medicalHistory.preExistingConditions || "None recorded"}
                </Text>
              </View>

              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Current Medications</Text>
                <Text style={styles.detailValue}>
                  {patientData.medicalHistory.currentMedications || "None recorded"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="info-outline" size={24} color="#9E9E9E" />
              <Text style={styles.emptyStateText}>No medical history recorded yet</Text>
            </View>
          )}
        </View>

        {/* Symptoms & Vitals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="favorite" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Symptoms & Vitals</Text>
            {latestVitals && (
              <Text style={styles.dateLabel}>{new Date(latestVitals.appointmentDate).toLocaleDateString()}</Text>
            )}
          </View>

          {latestVitals ? (
            <View style={styles.detailsGrid}>
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Symptoms</Text>
                <View style={styles.symptomsContainer}>
                  {latestVitals.symptoms.map((symptom, index) => (
                    <View key={index} style={styles.symptomTag}>
                      <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Blood Pressure</Text>
                <Text style={styles.detailValue}>{latestVitals.bloodPressure || "N/A"} mmHg</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sugar Level</Text>
                <Text style={styles.detailValue}>{latestVitals.sugarLevel || "N/A"} mg/dL</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Temperature</Text>
                <Text style={styles.detailValue}>{latestVitals.temperature || "N/A"} °F</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pulse Rate</Text>
                <Text style={styles.detailValue}>{latestVitals.pulseRate || "N/A"} bpm</Text>
              </View>
              <View style={styles.fileContainer}>
              <View>
              {latestVitals.docs.length > 0 && (
                <View style={styles.detailItem}>
                  {latestVitals.docs.map((doc, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <TouchableOpacity onPress={() => Linking.openURL(doc)}>
                        <Text style={styles.linkText}>Link {i + 1}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleDelDocument(doc)}>
                        <MaterialIcons name="delete" size={20} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              </View>
              <View style={styles.attachmentContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                  <Text style={styles.uploadButtonText}>Select File</Text>
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
               {attachment?.files.length > 0 && 
               
                <TouchableOpacity style={[styles.uploadButton, isUploading && {opacity:0.8}]} onPress={handleUploadDocument} disabled={isUploading}>
                  {isUploading? 
                  <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  </>
                  :
                  <>
                  <MaterialIcons name="file-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                  </>
                  }
                </TouchableOpacity>
                
        }
            </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="info-outline" size={24} color="#9E9E9E" />
              <Text style={styles.emptyStateText}>No vitals recorded yet</Text>
            </View>
          )}
        </View>

        {/* Doctor's Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="note" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            {latestDoctorNote && (
              <Text style={styles.dateLabel}>{new Date(latestDoctorNote.createdAt).toLocaleDateString()}</Text>
            )}
          </View>

          {latestDoctorNote ? (
            <View style={styles.detailsGrid}>
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Diagnosis</Text>
                <Text style={styles.detailValue}>{latestDoctorNote.diagnosis}</Text>
              </View>

              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Treatment Advice</Text>
                <Text style={styles.detailValue}>{latestDoctorNote.treatmentAdvice}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Next Appointment</Text>
                <Text style={styles.detailValue}>
                  {latestDoctorNote.nextAppointmentDate
                    ? new Date(latestDoctorNote.nextAppointmentDate).toLocaleDateString()
                    : "Not scheduled"}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Doctor</Text>
                <Text style={styles.detailValue}>{latestDoctorNote.doctorName}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="info-outline" size={24} color="#9E9E9E" />
              <Text style={styles.emptyStateText}>No doctor notes available yet</Text>
            </View>
          )}
        </View>

        {/* Appointments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="event" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Recent Appointments</Text>
          </View>

          {patientData.appointments.length > 0 ? (
            <>
              {patientData.appointments.slice(0, 3).map((appointment, index) => (
                <View key={index} style={styles.appointmentItem}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(appointment.status).text }]}>
                        {appointment.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.appointmentReason}>{appointment.reason}</Text>
                  <Text style={styles.appointmentDoctor}>Dr. {appointment.doctorName}</Text>
                  {appointment.notes && <Text style={styles.appointmentNotes}>{appointment.notes}</Text>}
                </View>
              ))}

              {patientData.appointments.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All Appointments</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="calendar-today" size={24} color="#9E9E9E" />
              <Text style={styles.emptyStateText}>No appointments scheduled yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Helper function to get status colors
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return { bg: "#E8F5E9", text: "#4CAF50" }
    case "scheduled":
      return { bg: "#E3F2FD", text: "#2196F3" }
    case "cancelled":
      return { bg: "#FFEBEE", text: "#F44336" }
    case "pending":
      return { bg: "#FFF8E1", text: "#FFA000" }
    default:
      return { bg: "#F5F5F5", text: "#757575" }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  LoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  LoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  profileBadgeText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 4,
    fontWeight: "500",
  },
  section: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  detailItem: {
    width: "50%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  fullWidth: {
    width: "100%",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  symptomsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  symptomTag: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  symptomText: {
    fontSize: 14,
    color: "#2196F3",
  },
  appointmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  appointmentReason: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    color: "#666",
  },
  appointmentNotes: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  viewAllButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  attachmentContainer: {
    marginTop: 8,
    gap:4,
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
  linkText: {
    color: "#2196F3",
    textDecorationLine: "underline",
  },
  fileContainer:{
    display:"flex",
    flexDirection:"column",
    width:"100%",
  }
})
"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  Modal,
  Platform,
  Alert,
  Linking,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Dialog } from "@/components/ui/Dialog"
import { router } from "expo-router"
import { getPatientDetail, searchPatient, verifyPatientOTP } from "@/api"
import { showToast } from "@/utils/toast"

interface Patient {
  patientId: string
  uniqueId: string
  userName: string
  age: number
  phoneNumber: string
  lastVisit: string
}

interface VitalRecord {
  id: string
  appointmentDate: string
  syptoms: string
  bloodPressure: string
  temperature: string
  sugarLevel: string
  pulseRate: string
  docs: string[]
}

interface AppointmentRecord {
   id: string
   appointmentDate: string
   appointmentTime: string
   reason: string
   status: string
   notes: string
   doctorName: string
}




// Column widths - defined once to ensure consistency
const columnWidths = {
  userName: 150,
  id: 80,
  age: 60,
  phoneNumber: 150,
  lastVisit: 100,
  actions: 80,
}

export default function SearchPatients() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isVitalsDialogOpen, setIsVitalsDialogOpen] = useState(false)
  const [vitalsRecord, setVitalsRecord] = useState<VitalRecord[] | null>(null)
  const [appointmentRecord, setAppointmentRecord] = useState<AppointmentRecord[] | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [patientData,setPatientData] = useState<Patient>()
  const isWeb = Platform.OS === "web"

  // New states for OTP functionality
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [showNoMatch, setShowNoMatch] = useState(false)



  const handleSearch = async() => {
    if (searchQuery.trim() === "") return
    try{
      const res = await searchPatient(searchQuery)
      if(res.success){
        showToast("success","OTP Sent")
        setIsOtpModalOpen(true)
      }else{
        showToast("error",res.message??"Patient not found")
      }
    }
    catch(e){
      console.log("Search Error:",e)
      showToast("error","Search Failed")
    }
  }

  const handleFetchPatientDetails = async(patientId:string) => {
    try{
      const res = await getPatientDetail(patientId)
      if(res.success){
        setVitalsRecord(res.data.vitalsHistory)
        setAppointmentRecord(res.data.appointments)
      }else{
        showToast("error",res.message?? "Failed to fetch patient details")
      }
    }
    catch(e){
      console.log("Fetch Error:",e)
      showToast("error","Failed to fetch patient details")
    }
  }

  const handleOtpSubmit = async() => {
    if (otpValue.trim().length > 0) {
      try{
        const res = await verifyPatientOTP(searchQuery,otpValue)
        if(res.success){
          showToast("success",res.message?? "Patient Verified")
          setIsOtpModalOpen(false)
          setPatientData(res.data.patient)
        }else{
          showToast("error",res.message?? "Verification Failed")
        }
      }
      catch(e){
        console.log("OTP Verfication Error:",e)
        showToast("error","Verification Failed")
      }
      setOtpValue("")
    } else {
      Alert.alert("Invalid OTP", "Please enter a valid OTP")
    }
  }

  const openVitalsDialog = async(patientId:string) => {
    setActiveTab("basic") 
    await handleFetchPatientDetails(patientId);
    setIsVitalsDialogOpen(true)
  }



  const RenderPatientItem = ({ item }: { item: Patient | undefined }) => (
   item&&
     <View style={styles.tableRow}>
      <Text style={[styles.cell, { width: columnWidths.userName }]}>{item.userName}</Text>
      <Text style={[styles.cell, { width: columnWidths.id }]}>{item.uniqueId}</Text>
      <Text style={[styles.cell, { width: columnWidths.age }]}>{item.age}</Text>
      <Text style={[styles.cell, { width: columnWidths.phoneNumber }]}>{item.phoneNumber}</Text>
      <Text style={[styles.cell, { width: columnWidths.lastVisit }]}>{new Date(item.lastVisit).toDateString()}</Text>
      <View style={[styles.actionsContainer, { width: columnWidths.actions }]}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openVitalsDialog(item.patientId)}>
          <MaterialIcons name="trending-up" size={20} color="#2196F3" />
        </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
              router.replace(`/appointment/${item.patientId}`)
          }}>
          <MaterialIcons name="event" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  )


  const tableWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)


  const renderVitalsContent = () => {
    if (!patientData) return null

    switch (activeTab) {
      case "basic":
        return (
          <ScrollView style={styles.tabScrollContainer}>
            <View style={styles.basicInfoContent}>
              <View style={styles.basicInfoRow}>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{patientData.userName}</Text>
                </View>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.detailLabel}>Unique ID</Text>
                  <Text style={styles.detailValue}>{patientData.uniqueId}</Text>
                </View>
              </View>
              <View style={styles.basicInfoRow}>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.detailLabel}>Age</Text>
                  <Text style={styles.detailValue}>{patientData.age}</Text>
                </View>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>{patientData.phoneNumber}</Text>
                </View>
              </View>
              <View style={styles.basicInfoRow}>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.detailLabel}>Last Visit</Text>
                  <Text style={styles.detailValue}>{new Date(patientData.lastVisit).toDateString()}</Text>
                </View>
                <View style={styles.basicInfoItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>Active</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )

      case "vitals":
        const vitals = vitalsRecord || []
        return (
          <View style={{ flex: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <FlatList
                data={vitals}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={() => (
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Date</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>BP</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Temp (°F)</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Pulse</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Sugar</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Symptoms</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Docs</Text>
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 100 }]}>{new Date(item.appointmentDate).toDateString()}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.bloodPressure}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.temperature}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.pulseRate}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.sugarLevel}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.syptoms}</Text>
                    {item.docs.length > 0 && (
                    <View style={styles.linkContainer}>
                      {item.docs.map((doc, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => Linking.openURL(doc)}
                          style={{ marginRight: 10 }}
                        >
                          <Text style={styles.linkText}>
                            Link {i + 1}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  </View>
                )}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ flexGrow: 1 }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />
            </ScrollView>
          </View>
        )

      case "appointments":
        const appointments = appointmentRecord || []
        return (
          <View style={{ flex: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <FlatList
                data={appointments}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={() => (
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Date</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Time</Text>
                    <Text style={[styles.tableHeaderText, { width: 150 }]}>Reason</Text>
                    <Text style={[styles.tableHeaderText, { width: 120 }]}>Doctor</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Status</Text>
                    <Text style={[styles.tableHeaderText, { width: 120 }]}>Notes</Text>
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 100 }]}>{new Date(item.appointmentDate).toDateString()}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.appointmentTime}</Text>
                    <Text style={[styles.tableCell, { width: 150 }]}>{item.reason}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{item.doctorName}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.status}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{item.notes}</Text>
                  </View>
                )}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ flexGrow: 1 }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />
            </ScrollView>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Patients</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID"
            placeholderTextColor={"#9e9e9e"}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text)
              setShowNoMatch(false)
            }}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>SEARCH</Text>
          </TouchableOpacity>
        </View>

        {/* No match message */}
        {showNoMatch && (
          <View style={styles.noMatchContainer}>
            <Text style={styles.noMatchText}>No match found for ID: {searchQuery}</Text>
          </View>
        )}
      </View>

      {/* Horizontally scrollable table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ width: tableWidth + 32 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: columnWidths.userName }]}>Name</Text>
            <Text style={[styles.headerCell, { width: columnWidths.id }]}>ID</Text>
            <Text style={[styles.headerCell, { width: columnWidths.age }]}>Age</Text>
            <Text style={[styles.headerCell, { width: columnWidths.phoneNumber }]}>Contact</Text>
            <Text style={[styles.headerCell, { width: columnWidths.lastVisit }]}>Last Visit</Text>
            <Text style={[styles.headerCell, { width: columnWidths.actions }]}>Actions</Text>
          </View>
          {/* Table Content */}
          <RenderPatientItem item={patientData}/>
        </View>
      </ScrollView>

      {/* Patient Details Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Patient Details"
        tabs={[
          { id: "basic", label: "BASIC INFO" },
          { id: "vitals", label: "VITALS HISTORY" },
          { id: "appointments", label: "APPOINTMENTS" },
        ]}
      >
        {selectedPatient && (
          <View style={styles.patientDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedPatient.userName}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Unique ID</Text>
                <Text style={styles.detailValue}>{selectedPatient.uniqueId}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{selectedPatient.age}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValue}>{selectedPatient.phoneNumber}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Last Visit</Text>
                <Text style={styles.detailValue}>{new Date(selectedPatient.lastVisit).toDateString()}</Text>
              </View>
            </View>
          </View>
        )}
      </Dialog>

      {/* Vitals Dialog */}
      <Modal
        visible={isVitalsDialogOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVitalsDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.vitalsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Details</Text>
              <TouchableOpacity onPress={() => setIsVitalsDialogOpen(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                paddingHorizontal: 8,
              }}
              style={{
                maxHeight: 48,
                width: "100%",
              }}
            >
              {[
                { id: "basic", label: "BASIC INFO" },
                { id: "vitals", label: "VITALS HISTORY" },
                { id: "appointments", label: "APPOINTMENTS" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    {
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderBottomWidth: 2,
                      borderBottomColor: "transparent",
                      marginRight: 8,
                    },
                    activeTab === item.id && {
                      borderBottomColor: "#2196F3",
                    },
                  ]}
                  onPress={() => setActiveTab(item.id)}
                >
                  <Text
                    style={[
                      {
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#999",
                      },
                      activeTab === item.id && {
                        color: "#2196F3",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tab Content with both vertical and horizontal scrolling */}
            <View style={styles.tabContentContainer}>{renderVitalsContent()}</View>

            {/* Close Button */}
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsVitalsDialogOpen(false)}>
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* OTP Modal */}
      <Modal
        visible={isOtpModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOtpModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>OTP Verification</Text>
              <TouchableOpacity onPress={() => setIsOtpModalOpen(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalText}>OTP has been sent to the Patient!</Text>

              <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                placeholderTextColor={"#9e9e9e"}
                value={otpValue}
                onChangeText={setOtpValue}
                maxLength={6}
              />

              <TouchableOpacity style={styles.verifyButton} onPress={handleOtpSubmit}>
                <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  searchButton: {
    backgroundColor: "#2196F3",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  noMatchContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ffebee",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  noMatchText: {
    color: "#d32f2f",
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerCell: {
    fontWeight: "600",
    color: "#333",
    fontSize: 14,
  },
  tableContent: {
    backgroundColor: "#fff",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  cell: {
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    padding: 8,
  },
  noResults: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
  },
  patientDetails: {
    gap: 24,
  },
  detailRow: {
    flexDirection: "row",
    gap: 24,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
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
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  vitalsModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "95%",
    maxWidth: 800,
    height: "80%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  otpButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  otpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  otpInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 40,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Tabs styles
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    width: "100%",
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  activeTabText: {
    color: "#2196F3",
  },
  tabContentContainer: {
    flex: 1,
    overflow: "hidden",
  },
  tabScrollContainer: {
    flex: 1,
  },
  // Table styles for tab content
  tableHeaderText: {
    fontWeight: "600",
    color: "#333",
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 100, // Ensure minimum width for columns
  },
  tableCell: {
    fontSize: 14,
    color: "#666",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minWidth: 100, // Ensure minimum width for columns
  },
  closeButtonContainer: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
  },
  scrollableContent: {
    minWidth: "100%",
  },
  basicInfoContent: {
    padding: 16,
    width: "100%",
  },
  basicInfoRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  basicInfoItem: {
    flex: 1,
    paddingRight: 16,
  },
  tableContainer: {
    minWidth: 500,
    paddingBottom: 16,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  linkContainer:{ 
    flexDirection: "row", 
    flexWrap: "wrap",
    gap: 8 
  },
  linkText: {
    color: "#2196F3",
    textDecorationLine: "underline",
  },

})


"use client"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, Platform, RefreshControl } from "react-native"
import { PieChart, BarChart } from "react-native-chart-kit"
import { useState, useEffect, useCallback } from "react"
import { showToast } from "@/utils/toast"
import { getAdminDashboard } from "@/api"
import { Loader } from "@/components/loader"


type DashboardStats = {
  totalPatients: string;
  pendingAppointments: string;
  symptomsDistribution: {
    [symptom: string]: string; // e.g., "Fever": "16.7%"
  };
  monthlyVisits: number[]; // 12 months
};

export default function ReportsAnalytics() {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<DashboardStats>({
    totalPatients: "0",
    pendingAppointments: "0",
    symptomsDistribution: {},
    monthlyVisits: [],
  })
  const isWeb = Platform.OS === "web"

  // Set minimum chart width to ensure it's always scrollable on small screens
  const minChartWidth = 500
  const chartWidth = Math.max(minChartWidth, dimensions.width - 40)

  const fetchData = useCallback(async () => {
    try {
      const res = await getAdminDashboard();
      if (res.success) {
        showToast("success", "Fetched data successfully")
        setAnalyticsData(res.data)
      } else {
        showToast("error", res.message ?? "Failed to fetch data")
      }
    }
    catch (e) {
      console.log("Dashboard Error:", e)
      showToast("error", "Failed to fetch data")
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  useEffect(() => {
    const handleFetch = async () => {
      setIsLoading(true)
      await fetchData()
      setIsLoading(false)
    }
    handleFetch();
  }, [fetchData])

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window)
    })
    return () => subscription?.remove()
  }, [])

  // Convert symptoms distribution to pie chart format
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#4BC0C0",
    "#9966FF",
    "#FF6384",
    "#36A2EB",
  ]
  const ailmentData = Object.entries(analyticsData.symptomsDistribution).map(([name, percentage], index) => {
    // Convert percentage string to number (remove % and parse)
    const value = Number.parseFloat(percentage.replace("%", ""))

    return {
      name,
      population: value,
      color: colors[index % colors.length], // Use modulo to cycle through colors if there are more symptoms than colors
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    }
  })

  // Prepare monthly visits data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyVisitsData = {
    labels: monthNames.slice(0, 6), // Show first 6 months to match original design
    datasets: [
      {
        data: analyticsData.monthlyVisits.slice(0, 6), // Show first 6 months to match original design
      },
    ],
  }

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 5,
    barPercentage: 1,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
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
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Total Patients Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Patients</Text>
            <Text style={styles.statsValue}>{analyticsData.totalPatients}</Text>
          </View>

          {/* Pending Appointments Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Pending Appointments</Text>
            <Text style={styles.statsValue}>{analyticsData.pendingAppointments}</Text>
          </View>
        </View>

        {/* Pie Chart - Common Ailments */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Common Ailments Distribution</Text>
          <View style={styles.legendContainer}>
            {ailmentData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.name} ({item.population}%)
                </Text>
              </View>
            ))}
          </View>

          {/* Horizontally scrollable pie chart */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.chartScrollContent}
          >
            <View style={styles.chartWrapper}>
              <PieChart
                data={ailmentData}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
                hasLegend={false}
              />
            </View>
          </ScrollView>
        </View>

        {/* Bar Chart - Monthly Patient Visits */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Patient Visits</Text>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#2196F3" }]} />
              <Text style={styles.legendText}>Patient Visits</Text>
            </View>
          </View>

          {/* Horizontally scrollable bar chart */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.chartScrollContent}
          >
            <View style={styles.chartWrapper}>
              <BarChart
                data={monthlyVisitsData}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Theme color #2196F3
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </ScrollView>
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
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#333",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100%",
  },
  chartScrollContent: {
    minWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#7F7F7F",
  },
})
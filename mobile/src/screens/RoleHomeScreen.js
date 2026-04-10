import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  adminAPI,
  authAPI,
  chargingStationAPI,
  feedbackAPI,
  fuelStationAPI,
  mechanicAPI,
  userAPI,
} from "../services/api";
import * as Location from "expo-location";
import { colors, spacing, borderRadius, fontSize } from "../components/theme";
import {
  Card,
  Button,
  StatusBadge,
  IconCircle,
  InfoRow,
  EmptyState,
  ErrorMessage,
  SuccessMessage,
  RatingStars,
  SectionTitle,
} from "../components/ui";
import TrackingModal from "../components/TrackingModal";
import {
  shouldBroadcastLocation,
  startLocationTracking,
  stopLocationTracking,
} from "../services/trackingService";

// Tab configuration with icons
const MECHANIC_TABS = [
  { id: "requests", label: "Requests", icon: "clipboard-outline" },
  { id: "stats", label: "Stats", icon: "bar-chart-outline" },
  { id: "feedback", label: "Feedback", icon: "star-outline" },
];

const FUEL_TABS = [
  { id: "requests", label: "Orders", icon: "clipboard-outline" },
  { id: "fuelTypes", label: "Prices", icon: "pricetag-outline" },
  { id: "stats", label: "Stats", icon: "bar-chart-outline" },
  { id: "feedback", label: "Feedback", icon: "star-outline" },
];

const CHARGING_TABS = [
  { id: "requests", label: "Requests", icon: "clipboard-outline" },
  { id: "chargingTypes", label: "Rates", icon: "pricetag-outline" },
  { id: "stats", label: "Stats", icon: "bar-chart-outline" },
  { id: "feedback", label: "Feedback", icon: "star-outline" },
];

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: "grid-outline" },
  { id: "approvals", label: "Approvals", icon: "checkmark-circle-outline" },
  { id: "activeRequests", label: "Active", icon: "time-outline" },
  { id: "feedback", label: "Feedback", icon: "chatbubbles-outline" },
];

// Status workflow options
const MECHANIC_STATUSES = [
  { value: "pending", label: "Pending", color: colors.text.muted },
  { value: "accepted", label: "Accept", color: colors.brand.primary },
  { value: "en-route", label: "En Route", color: colors.brand.amber },
  { value: "arrived", label: "Arrived", color: colors.brand.purple },
  { value: "in-progress", label: "In Progress", color: colors.brand.cyan },
  { value: "completed", label: "Complete", color: colors.brand.emerald },
  { value: "cancelled", label: "Cancel", color: colors.error },
];

const FUEL_STATUSES = [
  { value: "pending", label: "Pending", color: colors.text.muted },
  { value: "confirmed", label: "Confirm", color: colors.brand.primary },
  { value: "preparing", label: "Preparing", color: colors.brand.amber },
  {
    value: "out-for-delivery",
    label: "Out for Delivery",
    color: colors.brand.purple,
  },
  { value: "delivered", label: "Delivered", color: colors.brand.emerald },
  { value: "cancelled", label: "Cancel", color: colors.error },
];

const CHARGING_STATUSES = [
  { value: "pending", label: "Pending", color: colors.text.muted },
  { value: "confirmed", label: "Confirm", color: colors.brand.primary },
  { value: "dispatched", label: "Dispatched", color: colors.brand.amber },
  { value: "arrived", label: "Arrived", color: colors.brand.purple },
  { value: "charging", label: "Charging", color: colors.brand.cyan },
  { value: "completed", label: "Complete", color: colors.brand.emerald },
  { value: "cancelled", label: "Cancel", color: colors.error },
];

export default function RoleHomeScreen() {
  const { session, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const role = session?.user?.role;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileModalMaxHeight = Math.max(
    420,
    viewportHeight - insets.top - insets.bottom - spacing.xl,
  );

  const roleTabs = useMemo(() => {
    if (role === "mechanic") return MECHANIC_TABS;
    if (role === "fuelStation") return FUEL_TABS;
    if (role === "chargingStation") return CHARGING_TABS;
    return ADMIN_TABS;
  }, [role]);

  const [activeTab, setActiveTab] = useState(roleTabs[0].id);

  useEffect(() => {
    setActiveTab(roleTabs[0].id);
  }, [roleTabs]);

  const getRoleIcon = () => {
    if (role === "mechanic") return "construct";
    if (role === "fuelStation") return "flame";
    if (role === "chargingStation") return "flash";
    return "shield-checkmark";
  };

  const getRoleTitle = () => {
    if (role === "mechanic") return "Mechanic Dashboard";
    if (role === "fuelStation") return "Fuel Station Dashboard";
    if (role === "chargingStation") return "EV Charging Dashboard";
    return "Admin Dashboard";
  };

  return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: Math.max(insets.top - spacing.xs, 0),
            paddingBottom: insets.bottom,
          },
        ]}
      >
      {/* App Header - Branded */}
      <View style={styles.appHeader}>
        <View style={styles.appHeaderLeft}>
          <View style={styles.appLogoContainer}>
            <View style={styles.appLogoCircle}>
              <Ionicons name="car-sport" size={20} color="#b91c1c" />
              <View style={styles.appLogoWrench}>
                <Ionicons
                  name="construct"
                  size={10}
                  color={colors.text.inverse}
                />
              </View>
            </View>
          </View>
          <View style={styles.appTitleWrap}>
            <Text style={styles.appTitle}>On Road Assistance</Text>
            <Text style={styles.appSubtitle}>Help is on the way!</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.menuButtonPressed,
          ]}
          onPress={() => setShowProfileModal(true)}
        >
          <Ionicons name="menu" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabRow}
      >
        {roleTabs.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [
                styles.tabButton,
                selected && styles.tabButtonActive,
                pressed && !selected && styles.tabButtonPressed,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={selected ? colors.text.inverse : colors.text.muted}
              />
              <Text
                style={[styles.tabLabel, selected && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Panel Content */}
      {role === "mechanic" && (
        <MechanicPanel
          token={session?.token}
          activeTab={activeTab}
          mechanicId={session?.user?._id}
          bottomInset={insets.bottom}
        />
      )}
      {role === "fuelStation" && (
        <FuelPanel
          token={session?.token}
          activeTab={activeTab}
          stationId={session?.user?._id}
          bottomInset={insets.bottom}
        />
      )}
      {role === "chargingStation" && (
        <ChargingPanel
          token={session?.token}
          activeTab={activeTab}
          stationId={session?.user?._id}
          bottomInset={insets.bottom}
        />
      )}
      {role === "admin" && (
        <AdminPanel token={session?.token} activeTab={activeTab} />
      )}

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View
          style={[
            styles.modalOverlay,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: insets.bottom + spacing.xs,
            },
          ]}
        >
          <View
            style={[styles.modalContent, { height: profileModalMaxHeight }]}
          >
            <View style={[styles.modalHeader, styles.profileModalHeader]}>
              <Pressable
                style={styles.profileModalIconBtn}
                onPress={() => setShowProfileModal(false)}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={colors.text.secondary}
                />
              </Pressable>
              <Text style={[styles.modalTitle, styles.profileModalTitle]}>
                My Profile
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.profileModalLogoutAction,
                  pressed && styles.profileModalLogoutActionPressed,
                ]}
                onPress={logout}
              >
                <Text style={styles.profileModalLogoutText}>Logout</Text>
              </Pressable>
            </View>
            <ProfileModalContent
              token={session?.token}
              user={session?.user}
              role={role}
              bottomInset={insets.bottom}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============== MECHANIC PANEL ==============
function MechanicPanel({ token, activeTab, mechanicId, bottomInset = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);

  // Request update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  // Feedback response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState("");

  // Stats list modal
  const [showStatsListModal, setShowStatsListModal] = useState(false);
  const [statsListType, setStatsListType] = useState("");
  const [statsListData, setStatsListData] = useState([]);

  // Tracking state
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const locationSubscriptionRef = useRef(null);
  const { sendProviderLocation, userLocation, requestStatus } = useSocket();

  // Start/stop location broadcasting based on active en-route requests
  useEffect(() => {
    const enRouteRequest = requests.find((r) =>
      shouldBroadcastLocation("mechanic", r.status),
    );

    if (enRouteRequest && !isBroadcasting) {
      startBroadcasting(enRouteRequest);
    } else if (!enRouteRequest && isBroadcasting) {
      stopBroadcasting();
    }

    return () => {
      if (locationSubscriptionRef.current) {
        stopLocationTracking(locationSubscriptionRef.current);
      }
    };
  }, [requests]);

  // Refresh when socket status updates
  useEffect(() => {
    if (requestStatus) {
      loadRequests();
    }
  }, [requestStatus]);

  const startBroadcasting = async (request) => {
    const result = await startLocationTracking((coords) => {
      sendProviderLocation(
        request._id,
        request.user?._id || request.user,
        coords,
      );
    }, 5000);

    if (result.success) {
      locationSubscriptionRef.current = result.subscription;
      setIsBroadcasting(true);
    }
  };

  const stopBroadcasting = () => {
    if (locationSubscriptionRef.current) {
      stopLocationTracking(locationSubscriptionRef.current);
      locationSubscriptionRef.current = null;
    }
    setIsBroadcasting(false);
  };

  const openStatsListModal = async (type) => {
    setStatsListType(type);
    setShowStatsListModal(true);
    setLoading(true);
    try {
      const res = await mechanicAPI.getRequests(token);
      const allRequests = res?.data || [];
      let filtered = [];
      if (type === "pending") {
        filtered = allRequests.filter((r) => r.status === "pending");
      } else if (type === "active") {
        filtered = allRequests.filter((r) =>
          ["accepted", "en-route", "arrived", "in-progress"].includes(r.status),
        );
      } else if (type === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = allRequests.filter(
          (r) => r.status === "completed" && new Date(r.completedAt) >= today,
        );
      } else if (type === "completed") {
        filtered = allRequests.filter((r) => r.status === "completed");
      }
      setStatsListData(filtered);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mechanicAPI.getMe(token);
      setProfile(res?.data || null);
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mechanicAPI.getRequests(token);
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mechanicAPI.getStats(token);
      setStats(res?.data || null);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await feedbackAPI.getProviderFeedback(token, mechanicId);
      setFeedback(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, mechanicId]);

  const openUpdateModal = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setNotes(request.notes || "");
    setEstimatedCost(
      request.estimatedCost ? String(request.estimatedCost) : "",
    );
    setShowUpdateModal(true);
  };

  const updateStatus = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await mechanicAPI.updateRequestStatus(token, selectedRequest._id, {
        status: newStatus,
        notes: notes,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      });
      setSuccess("Status updated successfully!");
      setShowUpdateModal(false);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (fb) => {
    setSelectedFeedback(fb);
    setResponseText(fb.response || "");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedFeedback) return;
    setLoading(true);
    setError("");
    try {
      await feedbackAPI.respond(token, selectedFeedback._id, responseText);
      setShowResponseModal(false);
      setSuccess("Response submitted!");
      await loadFeedback();
    } catch (err) {
      setError(err.message || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") loadRequests();
    if (activeTab === "stats") loadStats();
    if (activeTab === "feedback") loadFeedback();
  }, [activeTab, loadRequests, loadStats, loadFeedback]);

  // Stats Tab
  if (activeTab === "stats") {
    const statsListTitle =
      statsListType === "pending"
        ? "Pending Requests"
        : statsListType === "active"
          ? "Active Requests"
          : statsListType === "today"
            ? "Completed Today"
            : "All Completed";

    return (
      <View style={styles.body}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadStats();
              }}
              tintColor={colors.brand.primary}
            />
          }
        >
          {loading && !showStatsListModal && (
            <ActivityIndicator
              style={styles.loader}
              color={colors.brand.primary}
            />
          )}
          <ErrorMessage message={error} />

          <SectionTitle>Request Statistics</SectionTitle>
          <Text style={styles.statHint}>Tap on a card to view requests</Text>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("pending")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="time-outline"
                  size={32}
                  color={colors.brand.amber}
                />
                <Text style={styles.statValue}>{stats?.pending || 0}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("active")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="construct-outline"
                  size={32}
                  color={colors.brand.cyan}
                />
                <Text style={styles.statValue}>{stats?.active || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("today")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="today-outline"
                  size={32}
                  color={colors.brand.emerald}
                />
                <Text style={styles.statValue}>
                  {stats?.completedToday || 0}
                </Text>
                <Text style={styles.statLabel}>Today</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("completed")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={32}
                  color={colors.brand.primary}
                />
                <Text style={styles.statValue}>
                  {stats?.totalCompleted || 0}
                </Text>
                <Text style={styles.statLabel}>Total Done</Text>
              </Card>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Stats List Modal */}
        <Modal visible={showStatsListModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.listModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{statsListTitle}</Text>
                <Pressable onPress={() => setShowStatsListModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>
              {loading ? (
                <ActivityIndicator
                  style={styles.loader}
                  color={colors.brand.primary}
                />
              ) : statsListData.length === 0 ? (
                <Text style={styles.emptyText}>No requests found</Text>
              ) : (
                <ScrollView
                  style={styles.listModalScrollView}
                  contentContainerStyle={styles.listModalScrollContent}
                >
                  {statsListData.map((item) => (
                    <Card key={item._id} style={styles.listItemCard}>
                      <View style={styles.listItemRow}>
                        <View style={styles.listItemTitleWrap}>
                          <Text style={styles.listItemName} numberOfLines={2}>
                            {item.problemDescription || "Service Request"}
                          </Text>
                        </View>
                        <StatusBadge status={item.status} />
                      </View>
                      <View style={styles.listItemDetail}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={colors.text.muted}
                          style={styles.listItemDetailIcon}
                        />
                        <Text style={styles.listItemDetailText}>
                          {item.user?.name || "Unknown"}
                        </Text>
                      </View>
                      {item.user?.phone && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.user.phone}
                          </Text>
                        </View>
                      )}
                      {item.vehicleType && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="car-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.vehicleType}
                          </Text>
                        </View>
                      )}
                      <View style={styles.listItemDetail}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.text.muted}
                          style={styles.listItemDetailIcon}
                        />
                        <Text style={styles.listItemDetailText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {/* Price Row */}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Est. Cost:</Text>
                        <Text style={styles.priceValue}>
                          ₹{item.estimatedCost || 0}
                        </Text>
                      </View>
                    </Card>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Feedback Tab
  if (activeTab === "feedback") {
    const avgRating =
      feedback.length > 0
        ? (
            feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
          ).toFixed(1)
        : "0.0";

    return (
      <View style={styles.body}>
        {/* Stats Card */}
        <Card style={styles.feedbackStatsCard}>
          <View style={styles.feedbackStats}>
            <View style={styles.feedbackStatItem}>
              <Text style={styles.feedbackStatValue}>{avgRating}</Text>
              <RatingStars rating={parseFloat(avgRating)} size={14} />
              <Text style={styles.feedbackStatLabel}>Average Rating</Text>
            </View>
            <View style={styles.feedbackStatDivider} />
            <View style={styles.feedbackStatItem}>
              <Text style={styles.feedbackStatValue}>{feedback.length}</Text>
              <Text style={styles.feedbackStatLabel}>Total Reviews</Text>
            </View>
          </View>
        </Card>

        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <FlatList
          data={feedback}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeedback();
              }}
              tintColor={colors.brand.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <EmptyState
                icon="star-outline"
                title="No Feedback Yet"
                subtitle="Your reviews from customers will appear here"
              />
            )
          }
          renderItem={({ item }) => (
            <Card style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <IconCircle icon="person" size={40} color={colors.brand.cyan} />
                <View style={styles.feedbackHeaderInfo}>
                  <Text style={styles.feedbackUserName}>
                    {item.user?.name || "Customer"}
                  </Text>
                  <Text style={styles.feedbackDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <RatingStars rating={item.rating} size={14} />
              </View>

              {item.comment && (
                <Text style={styles.feedbackComment}>"{item.comment}"</Text>
              )}

              {item.response ? (
                <View style={styles.responseBox}>
                  <Text style={styles.responseLabel}>Your Response:</Text>
                  <Text style={styles.responseText}>{item.response}</Text>
                </View>
              ) : (
                <Button
                  title="Respond"
                  variant="outline"
                  size="small"
                  icon="chatbubble-outline"
                  onPress={() => openResponseModal(item)}
                  style={styles.respondButton}
                />
              )}
            </Card>
          )}
        />

        {/* Response Modal */}
        <Modal visible={showResponseModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Respond to Feedback</Text>
                <Pressable onPress={() => setShowResponseModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              {selectedFeedback && (
                <View style={styles.feedbackPreview}>
                  <RatingStars rating={selectedFeedback.rating} size={14} />
                  <Text style={styles.feedbackPreviewComment}>
                    "{selectedFeedback.comment || "No comment"}"
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Your Response</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Write your response to the customer..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowResponseModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Submit"
                  onPress={submitResponse}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Requests Tab (default)
  return (
    <View style={styles.body}>
      {loading && (
        <ActivityIndicator style={styles.loader} color={colors.brand.primary} />
      )}
      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listPad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRequests();
            }}
            tintColor={colors.brand.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="clipboard-outline"
              title="No Requests"
              subtitle="New service requests will appear here"
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <IconCircle
                icon="car"
                size={44}
                color={
                  item.status === "completed"
                    ? colors.brand.emerald
                    : colors.brand.primary
                }
              />
              <View style={styles.requestHeaderInfo}>
                <Text style={styles.requestProblem} numberOfLines={1}>
                  {item.problemDescription || "Service Request"}
                </Text>
                <Text style={styles.requestDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.requestDetails}>
              <InfoRow
                icon="person-outline"
                label="Customer"
                value={item.user?.name || "Unknown"}
              />
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={item.user?.phone || "Not provided"}
              />
              <InfoRow
                icon="location-outline"
                label="Location"
                value={`${item.location?.coordinates?.[1]?.toFixed(4) || "?"}, ${item.location?.coordinates?.[0]?.toFixed(4) || "?"}`}
              />
              {item.estimatedCost != null && (
                <InfoRow
                  icon="cash-outline"
                  label="Est. Cost"
                  value={`₹${item.estimatedCost}`}
                />
              )}
              {item.notes && (
                <InfoRow
                  icon="document-text-outline"
                  label="Notes"
                  value={item.notes}
                />
              )}
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              {/* Navigate to User Button - show when en-route */}
              {shouldBroadcastLocation("mechanic", item.status) && (
                <Button
                  title="Navigate"
                  icon="navigate-outline"
                  variant="primary"
                  onPress={() => {
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                  style={styles.navigateButton}
                />
              )}

              {item.status !== "completed" && item.status !== "cancelled" && (
                <Button
                  title="Update Status"
                  variant="secondary"
                  size="small"
                  onPress={() => openUpdateModal(item)}
                  style={[
                    styles.updateButton,
                    shouldBroadcastLocation("mechanic", item.status) &&
                      styles.buttonHalf,
                  ]}
                />
              )}
            </View>
          </Card>
        )}
      />

      {/* Update Status Modal */}
      <Modal visible={showUpdateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Request</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Ionicons name="close" size={22} color={colors.text.secondary} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScrollArea}
              contentContainerStyle={styles.modalScrollAreaContent}
              showsVerticalScrollIndicator={true}
            >
              {selectedRequest && (
                <View style={styles.selectedRequestInfo}>
                  <Text style={styles.selectedRequestText}>
                    {selectedRequest.problemDescription || "Service Request"}
                  </Text>
                  <Text style={styles.selectedRequestCustomer}>
                    Customer: {selectedRequest.user?.name || "Unknown"}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtonsWrap}>
                {MECHANIC_STATUSES.map((status) => (
                  <Pressable
                    key={status.value}
                    style={[
                      styles.statusButton,
                      newStatus === status.value && {
                        backgroundColor: status.color,
                        borderColor: status.color,
                      },
                    ]}
                    onPress={() => setNewStatus(status.value)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        newStatus === status.value &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Estimated Cost (₹)</Text>
              <TextInput
                style={styles.input}
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                placeholder="Enter estimated cost"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes for the customer..."
                placeholderTextColor={colors.text.muted}
                multiline={true}
                numberOfLines={3}
              />
            </ScrollView>
            <View
              style={[
                styles.modalButtonsFixed,
                { paddingBottom: spacing.lg + bottomInset },
              ]}
            >
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowUpdateModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Update"
                onPress={updateStatus}
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracking Modal for navigating to user */}
      <TrackingModal
        visible={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setTrackingRequest(null);
        }}
        request={trackingRequest}
        requestType="mechanic"
        isProvider={true}
      />
    </View>
  );
}

// ============== FUEL STATION PANEL ==============
function FuelPanel({ token, activeTab, stationId, bottomInset = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);

  // Request update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [deliveryPerson, setDeliveryPerson] = useState({
    name: "",
    phone: "",
    vehicleNumber: "",
  });

  // Feedback response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState("");

  // Stats list modal
  const [showStatsListModal, setShowStatsListModal] = useState(false);
  const [statsListType, setStatsListType] = useState("");
  const [statsListData, setStatsListData] = useState([]);

  // Tracking state
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const locationSubscriptionRef = useRef(null);
  const { sendProviderLocation, userLocation, requestStatus } = useSocket();

  // Start/stop location broadcasting based on active out-for-delivery requests
  useEffect(() => {
    const activeRequest = requests.find((r) =>
      shouldBroadcastLocation("fuel", r.status),
    );

    if (activeRequest && !isBroadcasting) {
      startBroadcasting(activeRequest);
    } else if (!activeRequest && isBroadcasting) {
      stopBroadcasting();
    }

    return () => {
      if (locationSubscriptionRef.current) {
        stopLocationTracking(locationSubscriptionRef.current);
      }
    };
  }, [requests]);

  // Refresh when socket status updates
  useEffect(() => {
    if (requestStatus) {
      loadRequests();
    }
  }, [requestStatus]);

  const startBroadcasting = async (request) => {
    const result = await startLocationTracking((coords) => {
      sendProviderLocation(
        request._id,
        request.user?._id || request.user,
        coords,
      );
    }, 5000);

    if (result.success) {
      locationSubscriptionRef.current = result.subscription;
      setIsBroadcasting(true);
    }
  };

  const stopBroadcasting = () => {
    if (locationSubscriptionRef.current) {
      stopLocationTracking(locationSubscriptionRef.current);
      locationSubscriptionRef.current = null;
    }
    setIsBroadcasting(false);
  };

  const openStatsListModal = async (type) => {
    setStatsListType(type);
    setShowStatsListModal(true);
    setLoading(true);
    try {
      const res = await fuelStationAPI.getRequests(token);
      const allRequests = res?.data || [];
      let filtered = [];
      if (type === "pending") {
        filtered = allRequests.filter((r) => r.status === "pending");
      } else if (type === "active") {
        filtered = allRequests.filter((r) =>
          ["confirmed", "preparing", "out-for-delivery"].includes(r.status),
        );
      } else if (type === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = allRequests.filter(
          (r) => r.status === "delivered" && new Date(r.deliveredAt) >= today,
        );
      } else if (type === "completed") {
        filtered = allRequests.filter((r) => r.status === "delivered");
      }
      setStatsListData(filtered);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fuelStationAPI.getMe(token);
      const next = res?.data || null;
      setProfile(next);
      setFuelTypes(next?.fuelTypes || []);
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const saveFuelTypes = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await fuelStationAPI.updateFuelTypes(token, fuelTypes);
      setSuccess("Fuel prices updated!");
      await loadProfile();
    } catch (err) {
      setError(err.message || "Failed to save fuel types");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fuelStationAPI.getRequests(token);
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fuelStationAPI.getStats(token);
      setStats(res?.data || null);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await feedbackAPI.getProviderFeedback(token, stationId);
      setFeedback(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, stationId]);

  const openUpdateModal = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setDeliveryPerson({
      name: request.deliveryPersonName || "",
      phone: request.deliveryPersonPhone || "",
      vehicleNumber: request.vehicleNumber || "",
    });
    setShowUpdateModal(true);
  };

  const updateStatus = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updateData = { status: newStatus };
      // Always include delivery person details if filled
      if (
        deliveryPerson.name ||
        deliveryPerson.phone ||
        deliveryPerson.vehicleNumber
      ) {
        updateData.deliveryPerson = {
          name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          vehicleNumber: deliveryPerson.vehicleNumber,
        };
      }
      await fuelStationAPI.updateRequestStatus(
        token,
        selectedRequest._id,
        updateData,
      );
      setSuccess("Order updated successfully!");
      setShowUpdateModal(false);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (fb) => {
    setSelectedFeedback(fb);
    setResponseText(fb.response || "");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedFeedback) return;
    setLoading(true);
    setError("");
    try {
      await feedbackAPI.respond(token, selectedFeedback._id, responseText);
      setShowResponseModal(false);
      setSuccess("Response submitted!");
      await loadFeedback();
    } catch (err) {
      setError(err.message || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "fuelTypes") loadProfile();
    if (activeTab === "requests") loadRequests();
    if (activeTab === "stats") loadStats();
    if (activeTab === "feedback") loadFeedback();
  }, [activeTab, loadProfile, loadRequests, loadStats, loadFeedback]);

  // Stats Tab
  if (activeTab === "stats") {
    const statsListTitle =
      statsListType === "pending"
        ? "Pending Orders"
        : statsListType === "active"
          ? "Active Orders"
          : statsListType === "today"
            ? "Delivered Today"
            : "All Delivered";

    return (
      <View style={styles.body}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadStats();
              }}
              tintColor={colors.brand.primary}
            />
          }
        >
          {loading && !showStatsListModal && (
            <ActivityIndicator
              style={styles.loader}
              color={colors.brand.primary}
            />
          )}
          <ErrorMessage message={error} />

          <SectionTitle>Order Statistics</SectionTitle>
          <Text style={styles.statHint}>Tap on a card to view orders</Text>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("pending")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="time-outline"
                  size={32}
                  color={colors.brand.amber}
                />
                <Text style={styles.statValue}>{stats?.pending || 0}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("active")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="car-outline"
                  size={32}
                  color={colors.brand.cyan}
                />
                <Text style={styles.statValue}>{stats?.active || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("today")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="today-outline"
                  size={32}
                  color={colors.brand.emerald}
                />
                <Text style={styles.statValue}>
                  {stats?.completedToday || 0}
                </Text>
                <Text style={styles.statLabel}>Today</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("completed")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={32}
                  color={colors.brand.primary}
                />
                <Text style={styles.statValue}>
                  {stats?.totalCompleted || 0}
                </Text>
                <Text style={styles.statLabel}>Total Done</Text>
              </Card>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Stats List Modal */}
        <Modal visible={showStatsListModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.listModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{statsListTitle}</Text>
                <Pressable onPress={() => setShowStatsListModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>
              {loading ? (
                <ActivityIndicator
                  style={styles.loader}
                  color={colors.brand.primary}
                />
              ) : statsListData.length === 0 ? (
                <Text style={styles.emptyText}>No orders found</Text>
              ) : (
                <ScrollView
                  style={styles.listModalScrollView}
                  contentContainerStyle={styles.listModalScrollContent}
                >
                  {statsListData.map((item) => (
                    <Card key={item._id} style={styles.listItemCard}>
                      <View style={styles.listItemRow}>
                        <View style={styles.listItemTitleWrap}>
                          <Text style={styles.listItemName} numberOfLines={2}>
                            {item.fuelType} - {item.quantity}L
                          </Text>
                        </View>
                        <StatusBadge status={item.status} />
                      </View>
                      <View style={styles.listItemDetail}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={colors.text.muted}
                          style={styles.listItemDetailIcon}
                        />
                        <Text style={styles.listItemDetailText}>
                          {item.user?.name || "Unknown"}
                        </Text>
                      </View>
                      {item.user?.phone && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.user.phone}
                          </Text>
                        </View>
                      )}
                      {item.pricePerLiter != null && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="pricetag-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            ₹{item.pricePerLiter}/L
                          </Text>
                        </View>
                      )}
                      {item.paymentMethod && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="card-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.paymentMethod}
                          </Text>
                        </View>
                      )}
                      <View style={styles.listItemDetail}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.text.muted}
                          style={styles.listItemDetailIcon}
                        />
                        <Text style={styles.listItemDetailText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {/* Price Row */}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Total:</Text>
                        <Text style={styles.priceValue}>
                          ₹{item.totalPrice || 0}
                        </Text>
                      </View>
                    </Card>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Fuel Types Tab (Pricing)
  if (activeTab === "fuelTypes") {
    return (
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile();
            }}
            tintColor={colors.brand.primary}
          />
        }
      >
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <SectionTitle>Update Fuel Prices</SectionTitle>

        {fuelTypes.map((item, index) => (
          <Card key={`${item.type}-${index}`} style={styles.fuelTypeCard}>
            <View style={styles.fuelTypeHeader}>
              <View style={styles.fuelTypeIcon}>
                <Ionicons
                  name={
                    item.type === "Petrol"
                      ? "water"
                      : item.type === "Diesel"
                        ? "water-outline"
                        : "leaf"
                  }
                  size={24}
                  color={colors.brand.amber}
                />
              </View>
              <Text style={styles.fuelTypeName}>{item.type}</Text>
              <Pressable
                style={[
                  styles.availabilityToggle,
                  item.available && styles.availabilityToggleActive,
                ]}
                onPress={() => {
                  const next = [...fuelTypes];
                  next[index] = {
                    ...next[index],
                    available: !next[index].available,
                  };
                  setFuelTypes(next);
                }}
              >
                <Text
                  style={[
                    styles.availabilityText,
                    item.available && styles.availabilityTextActive,
                  ]}
                >
                  {item.available ? "Available" : "Unavailable"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.priceInputRow}>
              <Text style={styles.priceInputLabel}>Price per Liter (₹)</Text>
              <TextInput
                value={String(item.price || 0)}
                onChangeText={(value) => {
                  const next = [...fuelTypes];
                  next[index] = { ...next[index], price: Number(value) || 0 };
                  setFuelTypes(next);
                }}
                style={styles.priceInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
              />
            </View>
          </Card>
        ))}

        <Button
          title="Save Prices"
          icon="save-outline"
          onPress={saveFuelTypes}
          loading={loading}
          style={styles.saveButton}
        />
      </ScrollView>
    );
  }

  // Feedback Tab
  if (activeTab === "feedback") {
    const avgRating =
      feedback.length > 0
        ? (
            feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
          ).toFixed(1)
        : "0.0";

    return (
      <View style={styles.body}>
        {/* Stats Card */}
        <Card style={styles.feedbackStatsCard}>
          <View style={styles.feedbackStats}>
            <View style={styles.feedbackStatItem}>
              <Text style={styles.feedbackStatValue}>{avgRating}</Text>
              <RatingStars rating={parseFloat(avgRating)} size={14} />
              <Text style={styles.feedbackStatLabel}>Average Rating</Text>
            </View>
            <View style={styles.feedbackStatDivider} />
            <View style={styles.feedbackStatItem}>
              <Text style={styles.feedbackStatValue}>{feedback.length}</Text>
              <Text style={styles.feedbackStatLabel}>Total Reviews</Text>
            </View>
          </View>
        </Card>

        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <FlatList
          data={feedback}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeedback();
              }}
              tintColor={colors.brand.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <EmptyState
                icon="star-outline"
                title="No Reviews Yet"
                subtitle="Customer reviews will appear here"
              />
            )
          }
          renderItem={({ item }) => (
            <Card style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <IconCircle icon="person" size={40} color={colors.brand.cyan} />
                <View style={styles.feedbackHeaderInfo}>
                  <Text style={styles.feedbackUserName}>
                    {item.user?.name || "Customer"}
                  </Text>
                  <Text style={styles.feedbackDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <RatingStars rating={item.rating} size={14} />
              </View>

              {item.comment && (
                <Text style={styles.feedbackComment}>"{item.comment}"</Text>
              )}

              {item.response ? (
                <View style={styles.responseBox}>
                  <Text style={styles.responseLabel}>Your Response:</Text>
                  <Text style={styles.responseText}>{item.response}</Text>
                </View>
              ) : (
                <Button
                  title="Respond"
                  variant="outline"
                  size="small"
                  icon="chatbubble-outline"
                  onPress={() => openResponseModal(item)}
                  style={styles.respondButton}
                />
              )}
            </Card>
          )}
        />

        {/* Response Modal */}
        <Modal visible={showResponseModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Respond to Feedback</Text>
                <Pressable onPress={() => setShowResponseModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              {selectedFeedback && (
                <View style={styles.feedbackPreview}>
                  <RatingStars rating={selectedFeedback.rating} size={14} />
                  <Text style={styles.feedbackPreviewComment}>
                    "{selectedFeedback.comment || "No comment"}"
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Your Response</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Write your response to the customer..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowResponseModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Submit"
                  onPress={submitResponse}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Requests Tab (default)
  return (
    <View style={styles.body}>
      {loading && (
        <ActivityIndicator style={styles.loader} color={colors.brand.primary} />
      )}
      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listPad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRequests();
            }}
            tintColor={colors.brand.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="clipboard-outline"
              title="No Orders"
              subtitle="Fuel orders will appear here"
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <IconCircle
                icon="flame"
                size={44}
                color={
                  item.status === "delivered"
                    ? colors.brand.emerald
                    : colors.brand.amber
                }
              />
              <View style={styles.requestHeaderInfo}>
                <Text style={styles.requestProblem}>
                  {item.fuelType} - {item.quantity}L
                </Text>
                <Text style={styles.requestDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.requestDetails}>
              <InfoRow
                icon="person-outline"
                label="Customer"
                value={item.user?.name || "Unknown"}
              />
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={item.user?.phone || "Not provided"}
              />
              <InfoRow
                icon="cash-outline"
                label="Total"
                value={`₹${item.totalPrice || 0}`}
              />
              {item.deliveryPersonName && (
                <InfoRow
                  icon="bicycle-outline"
                  label="Delivery By"
                  value={item.deliveryPersonName}
                />
              )}
              {item.deliveryPersonPhone && (
                <InfoRow
                  icon="call-outline"
                  label="Delivery Phone"
                  value={item.deliveryPersonPhone}
                />
              )}
              {item.vehicleNumber && (
                <InfoRow
                  icon="car-outline"
                  label="Vehicle No."
                  value={item.vehicleNumber}
                />
              )}
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              {/* Navigate to User Button - show when out-for-delivery */}
              {shouldBroadcastLocation("fuel", item.status) && (
                <Button
                  title="Navigate"
                  icon="navigate-outline"
                  variant="primary"
                  onPress={() => {
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                  style={styles.navigateButton}
                />
              )}

              {item.status !== "delivered" && item.status !== "cancelled" && (
                <Button
                  title="Update Order"
                  variant="secondary"
                  size="small"
                  onPress={() => openUpdateModal(item)}
                  style={[
                    styles.updateButton,
                    shouldBroadcastLocation("fuel", item.status) &&
                      styles.buttonHalf,
                  ]}
                />
              )}
            </View>
          </Card>
        )}
      />

      {/* Update Status Modal */}
      <Modal visible={showUpdateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Ionicons name="close" size={22} color={colors.text.secondary} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScrollArea}
              contentContainerStyle={styles.modalScrollAreaContent}
              showsVerticalScrollIndicator={true}
            >
              {selectedRequest && (
                <View style={styles.selectedRequestInfo}>
                  <Text style={styles.selectedRequestText}>
                    {selectedRequest.fuelType} - {selectedRequest.quantity}L
                  </Text>
                  <Text style={styles.selectedRequestCustomer}>
                    Customer: {selectedRequest.user?.name || "Unknown"}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtonsWrap}>
                {FUEL_STATUSES.map((status) => (
                  <Pressable
                    key={status.value}
                    style={[
                      styles.statusButton,
                      newStatus === status.value && {
                        backgroundColor: status.color,
                        borderColor: status.color,
                      },
                    ]}
                    onPress={() => setNewStatus(status.value)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        newStatus === status.value &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(newStatus === "out-for-delivery" ||
                newStatus === "delivered") && (
                <>
                  <SectionTitle>Delivery Person Details</SectionTitle>

                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={deliveryPerson.name}
                    onChangeText={(text) =>
                      setDeliveryPerson({ ...deliveryPerson, name: text })
                    }
                    placeholder="Delivery person name"
                    placeholderTextColor={colors.text.muted}
                  />

                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={deliveryPerson.phone}
                    onChangeText={(text) =>
                      setDeliveryPerson({ ...deliveryPerson, phone: text })
                    }
                    placeholder="Phone number"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.inputLabel}>Vehicle Number</Text>
                  <TextInput
                    style={styles.input}
                    value={deliveryPerson.vehicleNumber}
                    onChangeText={(text) =>
                      setDeliveryPerson({
                        ...deliveryPerson,
                        vehicleNumber: text,
                      })
                    }
                    placeholder="Vehicle number"
                    placeholderTextColor={colors.text.muted}
                  />
                </>
              )}
            </ScrollView>
            <View
              style={[
                styles.modalButtonsFixed,
                { paddingBottom: spacing.lg + bottomInset },
              ]}
            >
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowUpdateModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Update"
                onPress={updateStatus}
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracking Modal for navigating to user */}
      <TrackingModal
        visible={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setTrackingRequest(null);
        }}
        request={trackingRequest}
        requestType="fuel"
        isProvider={true}
      />
    </View>
  );
}

// ============== CHARGING STATION PANEL ==============
function ChargingPanel({ token, activeTab, stationId, bottomInset = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [chargingTypes, setChargingTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);

  // Request update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [technician, setTechnician] = useState({
    name: "",
    phone: "",
    vehicleNumber: "",
  });

  // Feedback response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState("");

  // Stats list modal
  const [showStatsListModal, setShowStatsListModal] = useState(false);
  const [statsListType, setStatsListType] = useState("");
  const [statsListData, setStatsListData] = useState([]);

  // Tracking state
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const locationSubscriptionRef = useRef(null);
  const { sendProviderLocation, userLocation, requestStatus } = useSocket();

  // Start/stop location broadcasting based on active dispatched requests
  useEffect(() => {
    const activeRequest = requests.find((r) =>
      shouldBroadcastLocation("charging", r.status),
    );

    if (activeRequest && !isBroadcasting) {
      startBroadcasting(activeRequest);
    } else if (!activeRequest && isBroadcasting) {
      stopBroadcasting();
    }

    return () => {
      if (locationSubscriptionRef.current) {
        stopLocationTracking(locationSubscriptionRef.current);
      }
    };
  }, [requests]);

  // Refresh when socket status updates
  useEffect(() => {
    if (requestStatus) {
      loadRequests();
    }
  }, [requestStatus]);

  const startBroadcasting = async (request) => {
    const result = await startLocationTracking((coords) => {
      sendProviderLocation(
        request._id,
        request.user?._id || request.user,
        coords,
      );
    }, 5000);

    if (result.success) {
      locationSubscriptionRef.current = result.subscription;
      setIsBroadcasting(true);
    }
  };

  const stopBroadcasting = () => {
    if (locationSubscriptionRef.current) {
      stopLocationTracking(locationSubscriptionRef.current);
      locationSubscriptionRef.current = null;
    }
    setIsBroadcasting(false);
  };

  const openStatsListModal = async (type) => {
    setStatsListType(type);
    setShowStatsListModal(true);
    setLoading(true);
    try {
      const res = await chargingStationAPI.getRequests(token);
      const allRequests = res?.data || [];
      let filtered = [];
      if (type === "pending") {
        filtered = allRequests.filter((r) => r.status === "pending");
      } else if (type === "active") {
        filtered = allRequests.filter((r) =>
          ["confirmed", "dispatched", "arrived", "charging"].includes(r.status),
        );
      } else if (type === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = allRequests.filter(
          (r) => r.status === "completed" && new Date(r.completedAt) >= today,
        );
      } else if (type === "completed") {
        filtered = allRequests.filter((r) => r.status === "completed");
      }
      setStatsListData(filtered);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chargingStationAPI.getMe(token);
      const next = res?.data || null;
      setProfile(next);
      setChargingTypes(next?.chargingTypes || []);
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const saveChargingTypes = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await chargingStationAPI.updateChargingTypes(token, chargingTypes);
      setSuccess("Charging rates updated!");
      await loadProfile();
    } catch (err) {
      setError(err.message || "Failed to save charging types");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chargingStationAPI.getRequests(token);
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chargingStationAPI.getStats(token);
      setStats(res?.data || null);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await feedbackAPI.getProviderFeedback(token, stationId);
      setFeedback(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, stationId]);

  const openUpdateModal = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setTechnician({
      name: request.technicianName || "",
      phone: request.technicianPhone || "",
      vehicleNumber: request.vehicleNumber || "",
    });
    setShowUpdateModal(true);
  };

  const updateStatus = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updateData = { status: newStatus };
      // Always include technician details if filled
      if (technician.name || technician.phone || technician.vehicleNumber) {
        updateData.technician = {
          name: technician.name,
          phone: technician.phone,
          vehicleNumber: technician.vehicleNumber,
        };
      }
      await chargingStationAPI.updateRequestStatus(
        token,
        selectedRequest._id,
        updateData,
      );
      setSuccess("Request updated successfully!");
      setShowUpdateModal(false);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (fb) => {
    setSelectedFeedback(fb);
    setResponseText(fb.response || "");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedFeedback) return;
    setLoading(true);
    setError("");
    try {
      await feedbackAPI.respond(token, selectedFeedback._id, responseText);
      setShowResponseModal(false);
      setSuccess("Response submitted!");
      await loadFeedback();
    } catch (err) {
      setError(err.message || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "chargingTypes") loadProfile();
    if (activeTab === "requests") loadRequests();
    if (activeTab === "stats") loadStats();
    if (activeTab === "feedback") loadFeedback();
  }, [activeTab, loadProfile, loadRequests, loadStats, loadFeedback]);

  // Charging Types Tab (Rates)
  if (activeTab === "chargingTypes") {
    return (
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile();
            }}
            tintColor={colors.brand.primary}
          />
        }
      >
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <SectionTitle>Update Charging Rates</SectionTitle>

        {chargingTypes.map((item, index) => (
          <Card
            key={`${item.vehicleType}-${item.connectorType}-${index}`}
            style={styles.chargingTypeCard}
          >
            <View style={styles.chargingTypeHeader}>
              <IconCircle icon="flash" size={40} color={colors.brand.emerald} />
              <View style={styles.chargingTypeInfo}>
                <Text style={styles.chargingTypeName}>{item.vehicleType}</Text>
                <Text style={styles.chargingTypeConnector}>
                  {item.connectorType}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.availabilityToggle,
                  item.available && styles.availabilityToggleActive,
                ]}
                onPress={() => {
                  const next = [...chargingTypes];
                  next[index] = {
                    ...next[index],
                    available: !next[index].available,
                  };
                  setChargingTypes(next);
                }}
              >
                <Text
                  style={[
                    styles.availabilityText,
                    item.available && styles.availabilityTextActive,
                  ]}
                >
                  {item.available ? "Available" : "Unavailable"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.priceInputRow}>
              <Text style={styles.priceInputLabel}>Price per kWh (₹)</Text>
              <TextInput
                value={String(item.pricePerKwh || 0)}
                onChangeText={(value) => {
                  const next = [...chargingTypes];
                  next[index] = {
                    ...next[index],
                    pricePerKwh: Number(value) || 0,
                  };
                  setChargingTypes(next);
                }}
                style={styles.priceInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
              />
            </View>
          </Card>
        ))}

        <Button
          title="Save Rates"
          icon="save-outline"
          onPress={saveChargingTypes}
          loading={loading}
          style={styles.saveButton}
        />
      </ScrollView>
    );
  }

  // Stats Tab
  if (activeTab === "stats") {
    const statsListTitle =
      statsListType === "pending"
        ? "Pending Requests"
        : statsListType === "active"
          ? "Active Requests"
          : statsListType === "today"
            ? "Completed Today"
            : "All Completed";

    return (
      <View style={styles.body}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadStats();
              }}
              tintColor={colors.brand.primary}
            />
          }
        >
          {loading && !showStatsListModal && (
            <ActivityIndicator
              style={styles.loader}
              color={colors.brand.primary}
            />
          )}
          <ErrorMessage message={error} />

          <SectionTitle>Request Statistics</SectionTitle>
          <Text style={styles.statHint}>Tap on a card to view requests</Text>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("pending")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="time-outline"
                  size={32}
                  color={colors.brand.amber}
                />
                <Text style={styles.statValue}>{stats?.pending || 0}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("active")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="flash-outline"
                  size={32}
                  color={colors.brand.cyan}
                />
                <Text style={styles.statValue}>{stats?.active || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("today")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="today-outline"
                  size={32}
                  color={colors.brand.emerald}
                />
                <Text style={styles.statValue}>
                  {stats?.completedToday || 0}
                </Text>
                <Text style={styles.statLabel}>Today</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCardWrap}
              onPress={() => openStatsListModal("completed")}
            >
              <Card style={styles.statCard}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={32}
                  color={colors.brand.primary}
                />
                <Text style={styles.statValue}>
                  {stats?.totalCompleted || 0}
                </Text>
                <Text style={styles.statLabel}>Total Done</Text>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Revenue Stats if available */}
          {stats?.revenue != null && (
            <>
              <SectionTitle>Revenue</SectionTitle>
              <Card>
                <InfoRow
                  icon="cash-outline"
                  label="Today"
                  value={`₹${stats.revenue.today || 0}`}
                />
                <InfoRow
                  icon="calendar-outline"
                  label="This Week"
                  value={`₹${stats.revenue.week || 0}`}
                />
                <InfoRow
                  icon="calendar-outline"
                  label="This Month"
                  value={`₹${stats.revenue.month || 0}`}
                />
              </Card>
            </>
          )}
        </ScrollView>

        {/* Stats List Modal */}
        <Modal visible={showStatsListModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.listModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{statsListTitle}</Text>
                <Pressable onPress={() => setShowStatsListModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>
              {loading ? (
                <ActivityIndicator
                  style={styles.loader}
                  color={colors.brand.primary}
                />
              ) : statsListData.length === 0 ? (
                <Text style={styles.emptyText}>No requests found</Text>
              ) : (
                <ScrollView
                  style={styles.listModalScrollView}
                  contentContainerStyle={styles.listModalScrollContent}
                >
                  {statsListData.map((item) => (
                    <Card key={item._id} style={styles.listItemCard}>
                      <View style={styles.listItemRow}>
                        <View style={styles.listItemTitleWrap}>
                          <Text style={styles.listItemName} numberOfLines={2}>
                            {`${item.vehicleType || "Vehicle"} - ${item.connectorType || "Standard"}`}
                          </Text>
                        </View>
                        <StatusBadge status={item.status} />
                      </View>
                      <View style={styles.listItemDetail}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={colors.text.muted}
                          style={styles.listItemDetailIcon}
                        />
                        <Text style={styles.listItemDetailText}>
                          {item.user?.name || "Unknown"}
                        </Text>
                      </View>
                      {item.user?.phone && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.user.phone}
                          </Text>
                        </View>
                      )}
                      {item.estimatedEnergyNeeded != null && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="flash-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.estimatedEnergyNeeded} kWh
                          </Text>
                        </View>
                      )}
                      {item.pricePerKwh != null && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="pricetag-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            ₹{item.pricePerKwh}/kWh
                          </Text>
                        </View>
                      )}
                      {item.paymentMethod && (
                        <View style={styles.listItemDetail}>
                          <Ionicons
                            name="card-outline"
                            size={14}
                            color={colors.text.muted}
                            style={styles.listItemDetailIcon}
                          />
                          <Text style={styles.listItemDetailText}>
                            {item.paymentMethod}
                          </Text>
                        </View>
                      )}
                      <View style={styles.listItemDetail}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.text.muted}
                          style={styles.listItemDetailIcon}
                        />
                        <Text style={styles.listItemDetailText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {/* Price Row */}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Total:</Text>
                        <Text style={styles.priceValue}>
                          ₹{item.totalPrice || 0}
                        </Text>
                      </View>
                    </Card>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Feedback Tab
  if (activeTab === "feedback") {
    const avgRating =
      feedback.length > 0
        ? (
            feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
          ).toFixed(1)
        : "0.0";

    return (
      <View style={styles.body}>
        <Card style={styles.feedbackStatsCard}>
          <View style={styles.feedbackStats}>
            <View style={styles.feedbackStatItem}>
              <Text style={styles.feedbackStatValue}>{avgRating}</Text>
              <RatingStars rating={parseFloat(avgRating)} size={14} />
              <Text style={styles.feedbackStatLabel}>Average Rating</Text>
            </View>
            <View style={styles.feedbackStatDivider} />
            <View style={styles.feedbackStatItem}>
              <Text style={styles.feedbackStatValue}>{feedback.length}</Text>
              <Text style={styles.feedbackStatLabel}>Total Reviews</Text>
            </View>
          </View>
        </Card>

        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <FlatList
          data={feedback}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeedback();
              }}
              tintColor={colors.brand.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <EmptyState
                icon="star-outline"
                title="No Reviews Yet"
                subtitle="Customer reviews will appear here"
              />
            )
          }
          renderItem={({ item }) => (
            <Card style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <IconCircle icon="person" size={40} color={colors.brand.cyan} />
                <View style={styles.feedbackHeaderInfo}>
                  <Text style={styles.feedbackUserName}>
                    {item.user?.name || "Customer"}
                  </Text>
                  <Text style={styles.feedbackDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <RatingStars rating={item.rating} size={14} />
              </View>

              {item.comment && (
                <Text style={styles.feedbackComment}>"{item.comment}"</Text>
              )}

              {item.response ? (
                <View style={styles.responseBox}>
                  <Text style={styles.responseLabel}>Your Response:</Text>
                  <Text style={styles.responseText}>{item.response}</Text>
                </View>
              ) : (
                <Button
                  title="Respond"
                  variant="outline"
                  size="small"
                  icon="chatbubble-outline"
                  onPress={() => openResponseModal(item)}
                  style={styles.respondButton}
                />
              )}
            </Card>
          )}
        />

        {/* Response Modal */}
        <Modal visible={showResponseModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Respond to Feedback</Text>
                <Pressable onPress={() => setShowResponseModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              {selectedFeedback && (
                <View style={styles.feedbackPreview}>
                  <RatingStars rating={selectedFeedback.rating} size={14} />
                  <Text style={styles.feedbackPreviewComment}>
                    "{selectedFeedback.comment || "No comment"}"
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Your Response</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Write your response..."
                placeholderTextColor={colors.text.muted}
                multiline={true}
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowResponseModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Submit"
                  onPress={submitResponse}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Requests Tab (default)
  return (
    <View style={styles.body}>
      {loading && (
        <ActivityIndicator style={styles.loader} color={colors.brand.primary} />
      )}
      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listPad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRequests();
            }}
            tintColor={colors.brand.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="flash-outline"
              title="No Requests"
              subtitle="Charging requests will appear here"
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <IconCircle
                icon="flash"
                size={44}
                color={
                  item.status === "completed"
                    ? colors.brand.emerald
                    : colors.brand.cyan
                }
              />
              <View style={styles.requestHeaderInfo}>
                <Text style={styles.requestProblem}>
                  {`${item.vehicleType || "Vehicle"} - ${item.connectorType || "Connector"}`}
                </Text>
                <Text style={styles.requestDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.requestDetails}>
              <InfoRow
                icon="person-outline"
                label="Customer"
                value={item.user?.name || "Unknown"}
              />
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={item.user?.phone || "Not provided"}
              />
              <InfoRow
                icon="battery-half-outline"
                label="Battery"
                value={`${item.currentBatteryLevel || 0}% → ${item.targetBatteryLevel || 100}%`}
              />
              {item.estimatedCost != null && (
                <InfoRow
                  icon="cash-outline"
                  label="Est. Cost"
                  value={`₹${item.estimatedCost}`}
                />
              )}
              {item.technicianName && (
                <InfoRow
                  icon="person-outline"
                  label="Technician"
                  value={item.technicianName}
                />
              )}
              {item.technicianPhone && (
                <InfoRow
                  icon="call-outline"
                  label="Tech. Phone"
                  value={item.technicianPhone}
                />
              )}
              {item.vehicleNumber && (
                <InfoRow
                  icon="car-outline"
                  label="Vehicle No."
                  value={item.vehicleNumber}
                />
              )}
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              {/* Navigate to User Button - show when dispatched */}
              {shouldBroadcastLocation("charging", item.status) && (
                <Button
                  title="Navigate"
                  icon="navigate-outline"
                  variant="primary"
                  onPress={() => {
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                  style={styles.navigateButton}
                />
              )}

              {item.status !== "completed" && item.status !== "cancelled" && (
                <Button
                  title="Update Status"
                  variant="secondary"
                  size="small"
                  onPress={() => openUpdateModal(item)}
                  style={[
                    styles.updateButton,
                    shouldBroadcastLocation("charging", item.status) &&
                      styles.buttonHalf,
                  ]}
                />
              )}
            </View>
          </Card>
        )}
      />

      {/* Update Status Modal */}
      <Modal visible={showUpdateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Request</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Ionicons name="close" size={22} color={colors.text.secondary} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScrollArea}
              contentContainerStyle={styles.modalScrollAreaContent}
              showsVerticalScrollIndicator={true}
            >
              {selectedRequest && (
                <View style={styles.selectedRequestInfo}>
                  <Text style={styles.selectedRequestText}>
                    {`${selectedRequest.vehicleType} - ${selectedRequest.connectorType}`}
                  </Text>
                  <Text style={styles.selectedRequestCustomer}>
                    Customer: {selectedRequest.user?.name || "Unknown"}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtonsWrap}>
                {CHARGING_STATUSES.map((status) => (
                  <Pressable
                    key={status.value}
                    style={[
                      styles.statusButton,
                      newStatus === status.value && {
                        backgroundColor: status.color,
                        borderColor: status.color,
                      },
                    ]}
                    onPress={() => setNewStatus(status.value)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        newStatus === status.value &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(newStatus === "dispatched" ||
                newStatus === "arrived" ||
                newStatus === "charging") && (
                <>
                  <SectionTitle>Technician Details</SectionTitle>

                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={technician.name}
                    onChangeText={(text) =>
                      setTechnician({ ...technician, name: text })
                    }
                    placeholder="Technician name"
                    placeholderTextColor={colors.text.muted}
                  />

                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={technician.phone}
                    onChangeText={(text) =>
                      setTechnician({ ...technician, phone: text })
                    }
                    placeholder="Phone number"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.inputLabel}>Vehicle Number</Text>
                  <TextInput
                    style={styles.input}
                    value={technician.vehicleNumber}
                    onChangeText={(text) =>
                      setTechnician({ ...technician, vehicleNumber: text })
                    }
                    placeholder="Vehicle number"
                    placeholderTextColor={colors.text.muted}
                  />
                </>
              )}
            </ScrollView>
            <View
              style={[
                styles.modalButtonsFixed,
                { paddingBottom: spacing.lg + bottomInset },
              ]}
            >
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowUpdateModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Update"
                onPress={updateStatus}
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracking Modal for navigating to user */}
      <TrackingModal
        visible={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setTrackingRequest(null);
        }}
        request={trackingRequest}
        requestType="charging"
        isProvider={true}
      />
    </View>
  );
}

// ============== ADMIN PANEL ==============
function AdminPanel({ token, activeTab }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [pendingMechanics, setPendingMechanics] = useState([]);
  const [pendingFuel, setPendingFuel] = useState([]);
  const [pendingCharging, setPendingCharging] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState("all"); // "all", "Mechanic", "FuelStation"

  // Platform users/providers list modal
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState(""); // "users", "mechanics", "fuel", "charging"
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // Approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getDashboard(token);
      setDashboard(res?.data || null);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getFeedback(token);
      setAllFeedback(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const openListModal = async (type) => {
    setListType(type);
    setShowListModal(true);
    setListLoading(true);
    setListData([]);
    try {
      let res;
      if (type === "users") {
        res = await adminAPI.getUsers(token);
      } else if (type === "mechanics") {
        res = await adminAPI.getAllMechanics(token);
      } else if (type === "fuel") {
        res = await adminAPI.getAllFuelStations(token);
      } else if (type === "charging") {
        res = await adminAPI.getAllChargingStations(token);
      }
      setListData(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setListLoading(false);
    }
  };

  const revokeProvider = async (provider, type) => {
    setListLoading(true);
    setError("");
    try {
      if (type === "mechanics") {
        await adminAPI.revokeMechanic(token, provider._id);
      } else if (type === "fuel") {
        await adminAPI.revokeFuelStation(token, provider._id);
      } else if (type === "charging") {
        await adminAPI.revokeChargingStation(token, provider._id);
      }
      setSuccess("Approval revoked successfully!");
      setTimeout(() => setSuccess(""), 3000);
      // Reload list
      openListModal(type);
      loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to revoke approval");
    } finally {
      setListLoading(false);
    }
  };

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, fRes, cRes] = await Promise.all([
        adminAPI.getPendingMechanics(token),
        adminAPI.getPendingFuelStations(token),
        adminAPI.getPendingChargingStations(token),
      ]);
      setPendingMechanics(mRes?.data || []);
      setPendingFuel(fRes?.data || []);
      setPendingCharging(cRes?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load pending approvals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const loadActiveRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, fRes, cRes] = await Promise.all([
        adminAPI.getActiveMechanicRequests(token),
        adminAPI.getActiveFuelRequests(token),
        adminAPI.getActiveChargingRequests(token),
      ]);

      const all = [
        ...(mRes?.data || []).map((item) => ({ ...item, type: "mechanic" })),
        ...(fRes?.data || []).map((item) => ({ ...item, type: "fuel" })),
        ...(cRes?.data || []).map((item) => ({ ...item, type: "charging" })),
      ];

      setActiveRequests(all);
    } catch (err) {
      setError(err.message || "Failed to load active requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const openApprovalModal = (provider) => {
    setSelectedProvider(provider);
    setRejectionReason("");
    setShowApprovalModal(true);
  };

  const review = async (action) => {
    if (!selectedProvider) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { kind, _id } = selectedProvider;
      const payload = action === "reject" ? { reason: rejectionReason } : {};

      if (kind === "mechanic") {
        await adminAPI.reviewMechanic(token, _id, action, payload);
      }
      if (kind === "fuel") {
        await adminAPI.reviewFuelStation(token, _id, action, payload);
      }
      if (kind === "charging") {
        await adminAPI.reviewChargingStation(token, _id, action, payload);
      }

      setSuccess(
        `Provider ${action === "approve" ? "approved" : "rejected"} successfully!`,
      );
      setShowApprovalModal(false);
      await loadApprovals();
    } catch (err) {
      setError(err.message || "Review action failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") loadDashboard();
    if (activeTab === "approvals") loadApprovals();
    if (activeTab === "activeRequests") loadActiveRequests();
    if (activeTab === "feedback") loadFeedback();
  }, [
    activeTab,
    loadDashboard,
    loadApprovals,
    loadActiveRequests,
    loadFeedback,
  ]);

  // Overview Tab
  if (activeTab === "overview") {
    return (
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
            }}
            tintColor={colors.brand.primary}
          />
        }
      >
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <SectionTitle>Platform Statistics</SectionTitle>
        <Text style={styles.statHint}>Tap on a card to view all entries</Text>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCardWrap}
            onPress={() => openListModal("users")}
          >
            <Card style={styles.statCard}>
              <Ionicons
                name="people-outline"
                size={32}
                color={colors.brand.primary}
              />
              <Text style={styles.statValue}>{dashboard?.users || 0}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCardWrap}
            onPress={() => openListModal("mechanics")}
          >
            <Card style={styles.statCard}>
              <Ionicons
                name="construct-outline"
                size={32}
                color={colors.brand.amber}
              />
              <Text style={styles.statValue}>{dashboard?.mechanics || 0}</Text>
              <Text style={styles.statLabel}>Mechanics</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCardWrap}
            onPress={() => openListModal("fuel")}
          >
            <Card style={styles.statCard}>
              <Ionicons name="flame-outline" size={32} color={colors.error} />
              <Text style={styles.statValue}>
                {dashboard?.fuelStations || 0}
              </Text>
              <Text style={styles.statLabel}>Fuel Stations</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCardWrap}
            onPress={() => openListModal("charging")}
          >
            <Card style={styles.statCard}>
              <Ionicons
                name="flash-outline"
                size={32}
                color={colors.brand.emerald}
              />
              <Text style={styles.statValue}>
                {dashboard?.chargingStations || 0}
              </Text>
              <Text style={styles.statLabel}>EV Stations</Text>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Platform List Modal */}
        <Modal visible={showListModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.listModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {listType === "users"
                    ? "All Users"
                    : listType === "mechanics"
                      ? "All Mechanics"
                      : listType === "fuel"
                        ? "All Fuel Stations"
                        : "All EV Stations"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowListModal(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {listLoading ? (
                <ActivityIndicator
                  style={{ marginVertical: 40 }}
                  color={colors.brand.primary}
                />
              ) : listData.length === 0 ? (
                <Text style={styles.emptyText}>No data found</Text>
              ) : (
                <ScrollView
                  style={styles.listModalScrollView}
                  contentContainerStyle={styles.listModalScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {listData.map((item) => {
                    const isProvider = listType !== "users";
                    const isApproved = item.isApproved;
                    const name =
                      listType === "users"
                        ? item.name
                        : listType === "mechanics"
                          ? item.name
                          : item.stationName;
                    const subtitle =
                      listType === "users"
                        ? item.email
                        : listType === "mechanics"
                          ? item.mechanicType || "Mechanic"
                          : listType === "fuel"
                            ? "Fuel Station"
                            : "EV Station";

                    return (
                      <Card key={item._id} style={styles.listItemCard}>
                        <View style={styles.listItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.listItemName}>{name}</Text>
                            <Text style={styles.listItemSubtitle}>
                              {subtitle}
                            </Text>
                            {item.phone && (
                              <Text style={styles.listItemInfo}>
                                📞 {item.phone}
                              </Text>
                            )}
                            {item.email && listType !== "users" && (
                              <Text style={styles.listItemInfo}>
                                ✉️ {item.email}
                              </Text>
                            )}
                            {isProvider && (
                              <View style={styles.statusRow}>
                                <StatusBadge
                                  status={isApproved ? "Approved" : "Pending"}
                                  color={
                                    isApproved
                                      ? colors.brand.emerald
                                      : colors.brand.amber
                                  }
                                />
                                {item.availability !== undefined && (
                                  <StatusBadge
                                    status={
                                      item.availability
                                        ? "Available"
                                        : "Unavailable"
                                    }
                                    color={
                                      item.availability
                                        ? colors.brand.primary
                                        : colors.text.muted
                                    }
                                  />
                                )}
                              </View>
                            )}
                          </View>
                          {isProvider && isApproved && (
                            <TouchableOpacity
                              style={styles.revokeBtn}
                              onPress={() => revokeProvider(item, listType)}
                            >
                              <Text style={styles.revokeBtnText}>Revoke</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </Card>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Pending Approvals Summary */}
        <SectionTitle>Pending Approvals</SectionTitle>
        <Card>
          <View style={styles.pendingRow}>
            <View style={styles.pendingItem}>
              <IconCircle
                icon="construct"
                size={36}
                color={colors.brand.amber}
              />
              <Text style={styles.pendingCount}>
                {dashboard?.pendingMechanics || 0}
              </Text>
              <Text style={styles.pendingLabel}>Mechanics</Text>
            </View>
            <View style={styles.pendingItem}>
              <IconCircle icon="flame" size={36} color={colors.error} />
              <Text style={styles.pendingCount}>
                {dashboard?.pendingFuelStations || 0}
              </Text>
              <Text style={styles.pendingLabel}>Fuel</Text>
            </View>
            <View style={styles.pendingItem}>
              <IconCircle icon="flash" size={36} color={colors.brand.emerald} />
              <Text style={styles.pendingCount}>
                {dashboard?.pendingChargingStations || 0}
              </Text>
              <Text style={styles.pendingLabel}>EV</Text>
            </View>
          </View>
        </Card>

        {/* Active Requests Summary */}
        <SectionTitle>Active Requests</SectionTitle>
        <Card>
          <InfoRow
            icon="clipboard-outline"
            label="Mechanic Requests"
            value={String(dashboard?.activeMechanicRequests || 0)}
          />
          <InfoRow
            icon="clipboard-outline"
            label="Fuel Orders"
            value={String(dashboard?.activeFuelRequests || 0)}
          />
          <InfoRow
            icon="clipboard-outline"
            label="Charging Requests"
            value={String(dashboard?.activeChargingRequests || 0)}
          />
        </Card>
      </ScrollView>
    );
  }

  // Approvals Tab
  if (activeTab === "approvals") {
    const allPending = [
      ...pendingMechanics.map((item) => ({
        ...item,
        title: item.name,
        subtitle: item.mechanicType || "Mechanic",
        kind: "mechanic",
        icon: "construct",
        color: colors.brand.amber,
      })),
      ...pendingFuel.map((item) => ({
        ...item,
        title: item.stationName,
        subtitle: "Fuel Station",
        kind: "fuel",
        icon: "flame",
        color: colors.error,
      })),
      ...pendingCharging.map((item) => ({
        ...item,
        title: item.stationName,
        subtitle: "Charging Station",
        kind: "charging",
        icon: "flash",
        color: colors.brand.emerald,
      })),
    ];

    return (
      <View style={styles.body}>
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <FlatList
          data={allPending}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadApprovals();
              }}
              tintColor={colors.brand.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <EmptyState
                icon="checkmark-done-outline"
                title="All Caught Up!"
                subtitle="No pending approvals"
              />
            )
          }
          renderItem={({ item }) => (
            <Card style={styles.approvalCard}>
              <View style={styles.approvalHeader}>
                <IconCircle icon={item.icon} size={48} color={item.color} />
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalName}>
                    {item.title || "Provider"}
                  </Text>
                  <Text style={styles.approvalType}>{item.subtitle}</Text>
                </View>
                <View
                  style={[
                    styles.kindBadge,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Text style={[styles.kindBadgeText, { color: item.color }]}>
                    {item.kind}
                  </Text>
                </View>
              </View>

              <View style={styles.approvalDetails}>
                {item.phone && (
                  <InfoRow
                    icon="call-outline"
                    label="Phone"
                    value={item.phone}
                  />
                )}
                {item.email && (
                  <InfoRow
                    icon="mail-outline"
                    label="Email"
                    value={item.email}
                  />
                )}
                {item.address && (
                  <InfoRow
                    icon="location-outline"
                    label="Address"
                    value={item.address}
                  />
                )}
                {item.servicesOffered && (
                  <InfoRow
                    icon="list-outline"
                    label="Services"
                    value={(item.servicesOffered || []).slice(0, 3).join(", ")}
                  />
                )}
              </View>

              <View style={styles.approvalActions}>
                <Pressable
                  style={styles.approveButton}
                  onPress={() => {
                    setSelectedProvider(item);
                    review("approve");
                  }}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={18}
                    color={colors.text.inverse}
                  />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={styles.rejectButton}
                  onPress={() => openApprovalModal(item)}
                >
                  <Ionicons
                    name="close-outline"
                    size={18}
                    color={colors.error}
                  />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </Pressable>
              </View>
            </Card>
          )}
        />

        {/* Rejection Modal */}
        <Modal visible={showApprovalModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reject Provider</Text>
                <Pressable onPress={() => setShowApprovalModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              {selectedProvider && (
                <View style={styles.selectedProviderInfo}>
                  <IconCircle
                    icon={selectedProvider.icon}
                    size={40}
                    color={selectedProvider.color}
                  />
                  <View style={styles.selectedProviderText}>
                    <Text style={styles.selectedProviderName}>
                      {selectedProvider.title}
                    </Text>
                    <Text style={styles.selectedProviderType}>
                      {selectedProvider.subtitle}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>
                Reason for Rejection (Optional)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Provide a reason for rejection..."
                placeholderTextColor={colors.text.muted}
                multiline={true}
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowApprovalModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Reject"
                  variant="danger"
                  onPress={() => review("reject")}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Feedback Tab
  if (activeTab === "feedback") {
    const filteredFeedback =
      feedbackFilter === "all"
        ? allFeedback
        : allFeedback.filter((f) => f.serviceType === feedbackFilter);

    const mechanicCount = allFeedback.filter(
      (f) => f.serviceType === "Mechanic",
    ).length;
    const fuelCount = allFeedback.filter(
      (f) => f.serviceType === "FuelStation",
    ).length;

    return (
      <View style={styles.body}>
        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color={colors.brand.primary}
          />
        )}
        <ErrorMessage message={error} />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.feedbackFilterScroll}
          contentContainerStyle={styles.feedbackFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.feedbackFilterChip,
              feedbackFilter === "all" && styles.feedbackFilterChipActive,
            ]}
            onPress={() => setFeedbackFilter("all")}
          >
            <Text
              style={[
                styles.feedbackFilterText,
                feedbackFilter === "all" && styles.feedbackFilterTextActive,
              ]}
            >
              All ({allFeedback.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackFilterChip,
              feedbackFilter === "Mechanic" && styles.feedbackFilterChipActive,
            ]}
            onPress={() => setFeedbackFilter("Mechanic")}
          >
            <Ionicons
              name="construct"
              size={14}
              color={
                feedbackFilter === "Mechanic"
                  ? colors.text.inverse
                  : colors.brand.amber
              }
            />
            <Text
              style={[
                styles.feedbackFilterText,
                feedbackFilter === "Mechanic" &&
                  styles.feedbackFilterTextActive,
              ]}
            >
              Mechanics ({mechanicCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackFilterChip,
              feedbackFilter === "FuelStation" &&
                styles.feedbackFilterChipActive,
            ]}
            onPress={() => setFeedbackFilter("FuelStation")}
          >
            <Ionicons
              name="flame"
              size={14}
              color={
                feedbackFilter === "FuelStation"
                  ? colors.text.inverse
                  : colors.error
              }
            />
            <Text
              style={[
                styles.feedbackFilterText,
                feedbackFilter === "FuelStation" &&
                  styles.feedbackFilterTextActive,
              ]}
            >
              Fuel ({fuelCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <FlatList
          data={filteredFeedback}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeedback();
              }}
              tintColor={colors.brand.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <EmptyState
                icon="chatbubbles-outline"
                title="No Feedback Yet"
                subtitle="User feedback will appear here"
              />
            )
          }
          renderItem={({ item }) => {
            const getIcon = () => {
              if (item.serviceType === "Mechanic") return "construct";
              if (item.serviceType === "FuelStation") return "flame";
              return "flash";
            };
            const getColor = () => {
              if (item.serviceType === "Mechanic") return colors.brand.amber;
              if (item.serviceType === "FuelStation") return colors.error;
              return colors.brand.emerald;
            };
            const getProviderName = () => {
              // serviceProvider is populated with name or stationName
              return (
                item.serviceProvider?.name ||
                item.serviceProvider?.stationName ||
                (item.serviceType === "Mechanic" ? "Mechanic" : "Fuel Station")
              );
            };

            return (
              <Card style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <IconCircle icon={getIcon()} size={40} color={getColor()} />
                  <View style={styles.feedbackHeaderInfo}>
                    <Text style={styles.feedbackProviderName}>
                      {getProviderName()}
                    </Text>
                    <Text style={styles.feedbackType}>
                      {item.serviceType === "Mechanic"
                        ? "Mechanic"
                        : "Fuel Station"}
                    </Text>
                  </View>
                  <View style={styles.feedbackRating}>
                    <Ionicons
                      name="star"
                      size={16}
                      color={colors.brand.amber}
                    />
                    <Text style={styles.feedbackRatingText}>
                      {item.rating || 0}
                    </Text>
                  </View>
                </View>

                {item.comment && (
                  <Text style={styles.feedbackComment}>"{item.comment}"</Text>
                )}

                <View style={styles.feedbackFooter}>
                  <View style={styles.feedbackUserInfo}>
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={colors.text.muted}
                    />
                    <Text style={styles.feedbackUserName}>
                      {item.user?.name || "User"}
                    </Text>
                  </View>
                  <Text style={styles.feedbackDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      </View>
    );
  }

  // Active Requests Tab
  return (
    <View style={styles.body}>
      {loading && (
        <ActivityIndicator style={styles.loader} color={colors.brand.primary} />
      )}
      <ErrorMessage message={error} />

      <FlatList
        data={activeRequests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listPad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadActiveRequests();
            }}
            tintColor={colors.brand.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="checkmark-done-outline"
              title="No Active Requests"
              subtitle="All requests have been completed"
            />
          )
        }
        renderItem={({ item }) => {
          const getIcon = () => {
            if (item.type === "mechanic") return "construct";
            if (item.type === "fuel") return "flame";
            return "flash";
          };
          const getColor = () => {
            if (item.type === "mechanic") return colors.brand.amber;
            if (item.type === "fuel") return colors.error;
            return colors.brand.emerald;
          };

          return (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <IconCircle icon={getIcon()} size={44} color={getColor()} />
                <View style={styles.requestHeaderInfo}>
                  <Text style={styles.requestProblem}>
                    {item.type === "mechanic" &&
                      (item.problemDescription || "Mechanic Request")}
                    {item.type === "fuel" &&
                      `${item.fuelType || "Fuel"} - ${item.quantity || 0}L`}
                    {item.type === "charging" &&
                      `${item.vehicleType || "Vehicle"} Charging`}
                  </Text>
                  <Text style={styles.requestDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.requestDetails}>
                <InfoRow
                  icon="person-outline"
                  label="User"
                  value={item.user?.name || "Unknown"}
                />
                <InfoRow
                  icon="briefcase-outline"
                  label="Provider"
                  value={
                    item.mechanic?.name ||
                    item.fuelStation?.stationName ||
                    item.chargingStation?.stationName ||
                    "Assigned"
                  }
                />
                <InfoRow
                  icon="pricetag-outline"
                  label="Type"
                  value={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

// ============== PROFILE MODAL CONTENT ==============
function ProfileModalContent({ token, user, role, bottomInset = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);

  // Shared fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Mechanic fields
  const [mechanicType, setMechanicType] = useState("car");
  const [servicesOffered, setServicesOffered] = useState("");
  const [experience, setExperience] = useState("");
  const [mechanicAvailable, setMechanicAvailable] = useState(true);
  const [serviceRadius, setServiceRadius] = useState("");

  // Station fields
  const [stationName, setStationName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  // Fuel station fields
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryRadius, setDeliveryRadius] = useState("");
  const [deliveryCharges, setDeliveryCharges] = useState("");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("");

  // Charging station fields
  const [mobileChargingAvailable, setMobileChargingAvailable] = useState(true);
  const [serviceCharges, setServiceCharges] = useState("");
  const [estimatedResponseTime, setEstimatedResponseTime] = useState("");

  const setProfileFields = useCallback((nextProfile) => {
    const coords = nextProfile?.location?.coordinates || [];

    setName(nextProfile?.name || nextProfile?.ownerName || "");
    setPhone(nextProfile?.phone || "");
    setAddress(nextProfile?.address || "");
    setLatitude(coords[1] !== undefined ? String(coords[1]) : "");
    setLongitude(coords[0] !== undefined ? String(coords[0]) : "");

    setMechanicType(nextProfile?.mechanicType || "car");
    setServicesOffered(
      Array.isArray(nextProfile?.servicesOffered)
        ? nextProfile.servicesOffered.join(", ")
        : "",
    );
    setExperience(
      nextProfile?.experience !== undefined
        ? String(nextProfile.experience)
        : "",
    );
    setMechanicAvailable(nextProfile?.availability !== false);
    setServiceRadius(
      nextProfile?.serviceRadius !== undefined
        ? String(nextProfile.serviceRadius)
        : "",
    );

    setStationName(nextProfile?.stationName || "");
    setOwnerName(nextProfile?.ownerName || "");
    setOpeningHours(nextProfile?.openingHours || "");

    setDeliveryAvailable(nextProfile?.deliveryAvailable !== false);
    setDeliveryRadius(
      nextProfile?.deliveryRadius !== undefined
        ? String(nextProfile.deliveryRadius)
        : "",
    );
    setDeliveryCharges(
      nextProfile?.deliveryCharges !== undefined
        ? String(nextProfile.deliveryCharges)
        : "",
    );
    setMinimumOrderQuantity(
      nextProfile?.minimumOrderQuantity !== undefined
        ? String(nextProfile.minimumOrderQuantity)
        : "",
    );

    setMobileChargingAvailable(nextProfile?.mobileChargingAvailable !== false);
    setServiceCharges(
      nextProfile?.serviceCharges !== undefined
        ? String(nextProfile.serviceCharges)
        : "",
    );
    setEstimatedResponseTime(
      nextProfile?.estimatedResponseTime !== undefined
        ? String(nextProfile.estimatedResponseTime)
        : "",
    );
  }, []);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      let nextProfile = null;

      try {
        if (role === "mechanic") {
          nextProfile = (await mechanicAPI.getMe(token))?.data || null;
        } else if (role === "fuelStation") {
          nextProfile = (await fuelStationAPI.getMe(token))?.data || null;
        } else if (role === "chargingStation") {
          nextProfile = (await chargingStationAPI.getMe(token))?.data || null;
        } else if (role === "admin") {
          nextProfile = (await userAPI.getMe(token))?.data || null;
        }
      } catch {
        nextProfile = null;
      }

      if (!nextProfile) {
        const me = await authAPI.getMe(token);
        nextProfile = me?.user || null;
      }

      if (!nextProfile) {
        throw new Error("Could not load profile. Please try again.");
      }

      setProfile(nextProfile);
      setProfileFields(nextProfile);
    } catch (err) {
      setError(err.message || "Could not load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, role, user, setProfileFields]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const detectLocation = async () => {
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setLatitude(String(current.coords.latitude.toFixed(6)));
      setLongitude(String(current.coords.longitude.toFixed(6)));
    } catch {
      setError("Could not detect location");
    }
  };

  const buildLocationPayload = () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return {
      type: "Point",
      coordinates: [lng, lat],
    };
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let updateData = {};

      if (role === "admin") {
        updateData = { name, phone, address };
        await userAPI.updateProfile(token, updateData);
      } else if (role === "mechanic") {
        const parsedServices = servicesOffered
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        if (parsedServices.length === 0) {
          throw new Error("Please add at least one service offered.");
        }

        updateData = {
          name,
          phone,
          address,
          mechanicType: mechanicType || "car",
          servicesOffered: parsedServices,
          experience: Number(experience) || 0,
          availability: mechanicAvailable,
          serviceRadius: Number(serviceRadius) || 10,
        };
      } else if (role === "fuelStation") {
        updateData = {
          stationName,
          ownerName,
          phone,
          address,
          openingHours,
          deliveryAvailable,
          deliveryRadius: Number(deliveryRadius) || 5,
          deliveryCharges: Number(deliveryCharges) || 0,
          minimumOrderQuantity: Number(minimumOrderQuantity) || 5,
        };
      } else if (role === "chargingStation") {
        updateData = {
          stationName,
          ownerName,
          phone,
          address,
          openingHours,
          mobileChargingAvailable,
          serviceRadius: Number(serviceRadius) || 25,
          serviceCharges: Number(serviceCharges) || 150,
          estimatedResponseTime: Number(estimatedResponseTime) || 30,
        };
      }

      const location = buildLocationPayload();
      if (location) {
        updateData.location = location;
      }

      if (role === "mechanic") {
        await mechanicAPI.updateMe(token, updateData);
      }
      if (role === "fuelStation") {
        await fuelStationAPI.updateMe(token, updateData);
      }
      if (role === "chargingStation") {
        await chargingStationAPI.updateMe(token, updateData);
      }

      setSuccess("Profile updated successfully!");
      await loadProfile();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={modalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  const getRoleLabel = () => {
    if (role === "mechanic") return "Mechanic";
    if (role === "fuelStation") return "Fuel Station";
    if (role === "chargingStation") return "EV Charging Station";
    return "Admin";
  };

  return (
    <ScrollView
      style={modalStyles.scrollContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: spacing.xl + bottomInset + spacing.md,
      }}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {error ? <ErrorMessage message={error} /> : null}

      {/* Profile Hero Card */}
      <View style={modalStyles.profileHeroCard}>
        <View style={modalStyles.profileHeroGradient}>
          {/* Decorative circles */}
          <View style={modalStyles.profileDecorCircle1} />
          <View style={modalStyles.profileDecorCircle2} />

          <View style={modalStyles.profileHeroContent}>
            <View style={modalStyles.profileAvatarContainer}>
              <View style={modalStyles.profileAvatar}>
                <Ionicons
                  name={
                    role === "mechanic"
                      ? "construct"
                      : role === "fuelStation"
                        ? "flame"
                        : role === "chargingStation"
                          ? "flash"
                          : "person"
                  }
                  size={36}
                  color={colors.brand.primary}
                />
              </View>
              <View style={modalStyles.profileOnlineDot} />
            </View>

            <View style={modalStyles.profileHeroInfo}>
              <Text style={modalStyles.profileHeroName}>
                {name ||
                  profile?.name ||
                  profile?.stationName ||
                  profile?.ownerName ||
                  "Your Profile"}
              </Text>
              <View style={modalStyles.profileRoleBadge}>
                <Ionicons
                  name={
                    role === "mechanic"
                      ? "build-outline"
                      : role === "fuelStation"
                        ? "flame-outline"
                        : role === "chargingStation"
                          ? "flash-outline"
                          : "shield-checkmark-outline"
                  }
                  size={12}
                  color={colors.text.inverse}
                />
                <Text style={modalStyles.profileRoleText}>
                  {getRoleLabel()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={modalStyles.profileEmailText}>
            {profile?.email || user?.email}
          </Text>
        </View>
      </View>

      {/* Admin just shows info */}
      {role === "admin" ? (
        <>
          <Text style={modalStyles.sectionTitle}>Basic Information</Text>
          <Card>
            <Text style={modalStyles.inputLabel}>Name</Text>
            <TextInput
              style={modalStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={modalStyles.inputLabel}>Phone</Text>
            <TextInput
              style={modalStyles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={modalStyles.inputLabel}>Address</Text>
            <TextInput
              style={modalStyles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Your address"
              placeholderTextColor={colors.text.muted}
            />
          </Card>

          <Text style={modalStyles.sectionTitle}>Account Information</Text>
          <Card>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={profile?.email || "N/A"}
            />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Role"
              value="Administrator"
            />
            <InfoRow
              icon="calendar-outline"
              label="Member Since"
              value={
                profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
          </Card>

          {success ? <SuccessMessage message={success} /> : null}
          <Button
            title="Save Changes"
            icon="save-outline"
            onPress={handleUpdate}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />
        </>
      ) : (
        <>
          {/* Basic Info Section */}
          <Text style={modalStyles.sectionTitle}>Basic Information</Text>
          <Card>
            {role === "mechanic" ? (
              <>
                <Text style={modalStyles.inputLabel}>Name</Text>
                <TextInput
                  style={modalStyles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Phone</Text>
                <TextInput
                  style={modalStyles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Address</Text>
                <TextInput
                  style={modalStyles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Your address"
                  placeholderTextColor={colors.text.muted}
                />
              </>
            ) : (
              <>
                <Text style={modalStyles.inputLabel}>Station Name</Text>
                <TextInput
                  style={modalStyles.input}
                  value={stationName}
                  onChangeText={setStationName}
                  placeholder="Station name"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Owner Name</Text>
                <TextInput
                  style={modalStyles.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="Owner name"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Phone</Text>
                <TextInput
                  style={modalStyles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Opening Hours</Text>
                <TextInput
                  style={modalStyles.input}
                  value={openingHours}
                  onChangeText={setOpeningHours}
                  placeholder="6:00 AM - 10:00 PM"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Address</Text>
                <TextInput
                  style={modalStyles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Station address"
                  placeholderTextColor={colors.text.muted}
                />
              </>
            )}
          </Card>

          {/* Service Settings */}
          <Text style={modalStyles.sectionTitle}>Service Settings</Text>
          <Card>
            {role === "mechanic" && (
              <>
                <Text style={modalStyles.inputLabel}>Mechanic Type</Text>
                <View style={modalStyles.pickerWrap}>
                  <Picker
                    selectedValue={mechanicType}
                    onValueChange={setMechanicType}
                    style={modalStyles.picker}
                    dropdownIconColor={colors.text.secondary}
                    mode="dropdown"
                  >
                    <Picker.Item label="Car" value="car" />
                    <Picker.Item label="Bus/Truck" value="bus_truck" />
                    <Picker.Item label="Bike" value="bike" />
                  </Picker>
                </View>

                <Text style={modalStyles.inputLabel}>Experience (years)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Service Radius (km)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={serviceRadius}
                  onChangeText={setServiceRadius}
                  placeholder="10"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>
                  Services Offered (comma separated)
                </Text>
                <TextInput
                  style={modalStyles.input}
                  value={servicesOffered}
                  onChangeText={setServicesOffered}
                  placeholder="Flat Tyre, Engine Repair"
                  placeholderTextColor={colors.text.muted}
                />

                <View style={modalStyles.toggleRow}>
                  <Text style={modalStyles.toggleLabel}>
                    Available for Service
                  </Text>
                  <Pressable
                    style={[
                      modalStyles.toggleBtn,
                      mechanicAvailable && modalStyles.toggleBtnActive,
                    ]}
                    onPress={() => setMechanicAvailable(!mechanicAvailable)}
                  >
                    <Ionicons
                      name={
                        mechanicAvailable ? "checkmark-circle" : "close-circle"
                      }
                      size={20}
                      color={mechanicAvailable ? colors.success : colors.error}
                    />
                    <Text
                      style={[
                        modalStyles.toggleText,
                        {
                          color: mechanicAvailable
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {mechanicAvailable ? "Available" : "Unavailable"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {role === "fuelStation" && (
              <>
                <Text style={modalStyles.inputLabel}>Delivery Radius (km)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={deliveryRadius}
                  onChangeText={setDeliveryRadius}
                  placeholder="5"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Delivery Charges (₹)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={deliveryCharges}
                  onChangeText={setDeliveryCharges}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Minimum Order (L)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={minimumOrderQuantity}
                  onChangeText={setMinimumOrderQuantity}
                  placeholder="5"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <View style={modalStyles.toggleRow}>
                  <Text style={modalStyles.toggleLabel}>
                    Delivery Available
                  </Text>
                  <Pressable
                    style={[
                      modalStyles.toggleBtn,
                      deliveryAvailable && modalStyles.toggleBtnActive,
                    ]}
                    onPress={() => setDeliveryAvailable(!deliveryAvailable)}
                  >
                    <Ionicons
                      name={
                        deliveryAvailable ? "checkmark-circle" : "close-circle"
                      }
                      size={20}
                      color={deliveryAvailable ? colors.success : colors.error}
                    />
                    <Text
                      style={[
                        modalStyles.toggleText,
                        {
                          color: deliveryAvailable
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {deliveryAvailable ? "Yes" : "No"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {role === "chargingStation" && (
              <>
                <Text style={modalStyles.inputLabel}>Service Radius (km)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={serviceRadius}
                  onChangeText={setServiceRadius}
                  placeholder="25"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>Service Charges (₹)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={serviceCharges}
                  onChangeText={setServiceCharges}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <Text style={modalStyles.inputLabel}>
                  Estimated Response Time (min)
                </Text>
                <TextInput
                  style={modalStyles.input}
                  value={estimatedResponseTime}
                  onChangeText={setEstimatedResponseTime}
                  placeholder="30"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.muted}
                />

                <View style={modalStyles.toggleRow}>
                  <Text style={modalStyles.toggleLabel}>Mobile Charging</Text>
                  <Pressable
                    style={[
                      modalStyles.toggleBtn,
                      mobileChargingAvailable && modalStyles.toggleBtnActive,
                    ]}
                    onPress={() =>
                      setMobileChargingAvailable(!mobileChargingAvailable)
                    }
                  >
                    <Ionicons
                      name={
                        mobileChargingAvailable
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={20}
                      color={
                        mobileChargingAvailable ? colors.success : colors.error
                      }
                    />
                    <Text
                      style={[
                        modalStyles.toggleText,
                        {
                          color: mobileChargingAvailable
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {mobileChargingAvailable ? "Enabled" : "Disabled"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Card>

          <Text style={modalStyles.sectionTitle}>Location</Text>
          <Card>
            <Text style={modalStyles.inputLabel}>Latitude</Text>
            <TextInput
              style={modalStyles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="12.9716"
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={modalStyles.inputLabel}>Longitude</Text>
            <TextInput
              style={modalStyles.input}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="77.5946"
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />

            <Pressable
              style={modalStyles.detectLocationButton}
              onPress={detectLocation}
            >
              <Ionicons
                name="navigate-outline"
                size={16}
                color={colors.brand.primary}
              />
              <Text style={modalStyles.detectLocationText}>Auto Detect</Text>
            </Pressable>
          </Card>

          {/* Account Info */}
          <Text style={modalStyles.sectionTitle}>Account Information</Text>
          <Card>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={profile?.email || "N/A"}
            />
            <InfoRow
              icon="calendar-outline"
              label="Member Since"
              value={
                profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
            <InfoRow
              icon="checkmark-circle-outline"
              label="Approved"
              value={profile?.isApproved ? "Yes" : "Pending"}
            />
            <InfoRow
              icon="star-outline"
              label="Rating"
              value={`${(profile?.rating || 0).toFixed(1)} (${profile?.totalRatings || 0} reviews)`}
            />
          </Card>

          {/* Save Button */}
          {success ? <SuccessMessage message={success} /> : null}
          <Button
            title="Save Changes"
            icon="save-outline"
            onPress={handleUpdate}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}
    </ScrollView>
  );
}

const modalStyles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flex: 1,
    minHeight: 0,
    padding: spacing.md,
  },
  // Profile Hero Card
  profileHeroCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  profileHeroGradient: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    position: "relative",
  },
  profileDecorCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  profileDecorCircle2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  profileHeroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  profileAvatarContainer: {
    position: "relative",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  profileOnlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.emerald,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  profileHeroInfo: {
    flex: 1,
  },
  profileHeroName: {
    color: colors.text.inverse,
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  profileRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  profileRoleText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  profileEmailText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: fontSize.md,
  },
  pickerWrap: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  picker: {
    color: colors.text.primary,
    backgroundColor: "transparent",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  toggleLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  detectLocationButton: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: `${colors.brand.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}30`,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
  },
  detectLocationText: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});

// ============== STYLES ==============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  // App Header - Branded
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  appHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  appLogoContainer: {
    position: "relative",
  },
  appLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border.default,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  appLogoWrench: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand.amber,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg.primary,
  },
  appTitleWrap: {
    flex: 1,
  },
  appTitle: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  appSubtitle: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  menuButtonPressed: {
    backgroundColor: colors.bg.tertiary,
  },

  // Legacy styles (keeping for compatibility)
  headerWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  roleTitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  // Tabs
  tabScrollView: {
    maxHeight: 50,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabButtonPressed: {
    backgroundColor: colors.bg.tertiary,
    transform: [{ scale: 0.98 }],
  },
  tabLabel: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.text.inverse,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  bodyContent: {
    paddingBottom: 40,
  },

  // Profile styles
  profileCard: {
    marginTop: spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginLeft: 6,
  },

  // Services
  servicesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  serviceTag: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  serviceText: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },

  // Loader
  loader: {
    marginVertical: spacing.lg,
  },

  // List
  listPad: {
    paddingBottom: 40,
  },

  // Request Card
  requestCard: {
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  requestHeaderInfo: {
    flex: 1,
  },
  requestProblem: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  requestDate: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  requestDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: colors.brand.primary,
  },
  updateButton: {
    flex: 1,
  },
  buttonHalf: {
    flex: 1,
  },

  // Feedback styles
  feedbackStatsCard: {
    marginBottom: spacing.md,
  },
  feedbackStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackStatItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  feedbackStatValue: {
    color: colors.text.primary,
    fontSize: fontSize.xxxl,
    fontWeight: "700",
  },
  feedbackStatLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  feedbackStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.lg,
  },
  feedbackCard: {
    marginBottom: spacing.md,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  feedbackHeaderInfo: {
    flex: 1,
  },
  feedbackUserName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  feedbackDate: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },
  feedbackComment: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  responseBox: {
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  responseLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  responseText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  respondButton: {
    marginTop: spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "90%",
    paddingTop: spacing.xl,
  },
  modalScrollArea: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: spacing.xl,
  },
  modalScrollAreaContent: {
    paddingBottom: spacing.md,
  },
  modalButtonsFixed: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  modalScrollContent: {
    maxHeight: "90%",
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: "92%",
    minHeight: 0,
    overflow: "hidden",
  },
  listModalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    maxHeight: "85%",
    flex: 1,
  },
  listModalScrollView: {
    flex: 1,
  },
  listModalScrollContent: {
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    minHeight: 40,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 0,
  },
  profileModalHeader: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: "flex-start",
    gap: spacing.md,
  },
  profileModalLogoutAction: {
    marginLeft: "auto",
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.error}55`,
  },
  profileModalLogoutActionPressed: {
    opacity: 0.65,
  },
  profileModalLogoutText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  profileModalTitle: {
    fontSize: fontSize.xl,
  },
  profileModalIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  feedbackPreview: {
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  feedbackPreviewComment: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  selectedRequestInfo: {
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectedRequestText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  selectedRequestCustomer: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalButton: {
    flex: 1,
  },

  // Input
  inputLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: fontSize.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Status buttons
  statusButtonsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statusButtonText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  statusButtonTextActive: {
    color: colors.text.inverse,
  },

  // Fuel Types
  fuelPricesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  fuelPriceItem: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: "center",
    minWidth: 80,
  },
  fuelPriceType: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  fuelPriceValue: {
    color: colors.brand.amber,
    fontSize: fontSize.md,
    fontWeight: "700",
    marginTop: 2,
  },
  fuelPriceNA: {
    color: colors.error,
  },
  fuelTypeCard: {
    marginBottom: spacing.md,
  },
  fuelTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  fuelTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.brand.amber}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  fuelTypeName: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  availabilityToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  availabilityToggleActive: {
    backgroundColor: `${colors.brand.emerald}20`,
    borderColor: colors.brand.emerald,
  },
  availabilityText: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  availabilityTextActive: {
    color: colors.brand.emerald,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  priceInputLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  priceInput: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
    minWidth: 100,
    textAlign: "center",
  },
  saveButton: {
    marginTop: spacing.lg,
  },

  // Charging Types
  chargingOptionsGrid: {
    gap: spacing.sm,
  },
  chargingOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  chargingOptionText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  chargingOptionPrice: {
    color: colors.brand.emerald,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  chargingTypeCard: {
    marginBottom: spacing.md,
  },
  chargingTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  chargingTypeInfo: {
    flex: 1,
  },
  chargingTypeName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  chargingTypeConnector: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  statCardWrap: {
    width: "48%",
    marginBottom: spacing.md,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  statLabel: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  statHint: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  // Admin - List Modal Items
  listItemCard: {
    marginBottom: spacing.md,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  listItemTitleWrap: {
    flex: 1,
    flexShrink: 1,
  },
  listItemName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  listItemSubtitle: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  listItemInfo: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  listItemSub: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  listItemDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  listItemDetailIcon: {
    marginRight: spacing.xs,
  },
  listItemDetailText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  listItemDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  priceLabel: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  priceValue: {
    color: colors.brand.emerald,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  revokeBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  revokeBtnText: {
    color: colors.text.inverse,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },

  // Admin - Pending
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  pendingItem: {
    alignItems: "center",
    gap: spacing.sm,
  },
  pendingCount: {
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  pendingLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },

  // Admin - Approval Card
  approvalCard: {
    marginBottom: spacing.md,
  },
  approvalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  approvalType: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  kindBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  kindBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  approvalDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  approvalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.brand.emerald,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  approveButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: `${colors.error}20`,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },

  // Selected provider in modal
  selectedProviderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  selectedProviderText: {
    flex: 1,
  },
  selectedProviderName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  selectedProviderType: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },

  // Feedback Tab Styles
  feedbackFilterScroll: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  feedbackFilterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  feedbackFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  feedbackFilterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  feedbackFilterText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  feedbackFilterTextActive: {
    color: colors.text.inverse,
  },
  feedbackCard: {
    marginBottom: spacing.md,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  feedbackHeaderInfo: {
    flex: 1,
  },
  feedbackProviderName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  feedbackType: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  feedbackRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.brand.amber}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  feedbackRatingText: {
    color: colors.brand.amber,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  feedbackComment: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    lineHeight: 20,
  },
  feedbackFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  feedbackUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feedbackUserName: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },
  feedbackDate: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },
});

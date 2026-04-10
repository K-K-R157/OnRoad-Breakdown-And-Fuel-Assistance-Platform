import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  chargingStationAPI,
  feedbackAPI,
  fuelStationAPI,
  mechanicAPI,
  userAPI,
} from "../services/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  FilterChip,
  IconCircle,
  InfoRow,
  RatingStars,
  SectionTitle,
  StatusBadge,
  SuccessMessage,
} from "../components/ui";
import { colors, borderRadius, spacing, fontSize } from "../components/theme";
import TrackingModal from "../components/TrackingModal";
import { isRequestTrackable } from "../services/trackingService";
import * as Location from "expo-location";

const TABS = [
  { id: "mechanic", label: "Mechanic", icon: "construct-outline" },
  { id: "fuel", label: "Fuel", icon: "flame-outline" },
  { id: "charging", label: "EV", icon: "flash-outline" },
  { id: "requests", label: "Requests", icon: "time-outline" },
  { id: "feedback", label: "Feedback", icon: "star-outline" },
];

const MECHANIC_TYPES = [
  { id: "", label: "All Types", emoji: "🔧" },
  { id: "car", label: "Car", emoji: "🚗" },
  { id: "bus_truck", label: "Bus/Truck", emoji: "🚛" },
  { id: "bike", label: "Bike", emoji: "🏍️" },
];

const FUEL_TYPES = [
  { id: "", label: "All Fuels", emoji: "⛽" },
  { id: "Petrol", label: "Petrol", emoji: "🟢" },
  { id: "Diesel", label: "Diesel", emoji: "🟡" },
  { id: "CNG", label: "CNG", emoji: "🔵" },
];

const VEHICLE_TYPES = [
  { id: "", label: "All", emoji: "🚙" },
  { id: "2-wheeler", label: "2-Wheeler", emoji: "🛵" },
  { id: "3-wheeler", label: "3-Wheeler", emoji: "🛺" },
  { id: "4-wheeler", label: "4-Wheeler", emoji: "🚗" },
  { id: "commercial", label: "Commercial", emoji: "🚛" },
];

const CONNECTOR_TYPES = [
  { id: "", label: "All", emoji: "🔌" },
  { id: "Type2", label: "Type 2", emoji: "⚡" },
  { id: "CCS2", label: "CCS2", emoji: "⚡" },
  { id: "CHAdeMO", label: "CHAdeMO", emoji: "⚡" },
  { id: "GBT", label: "GB/T", emoji: "⚡" },
];

export default function UserHomeScreen() {
  const { session, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState("mechanic");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileModalMaxHeight = Math.max(
    420,
    viewportHeight - insets.top - insets.bottom - spacing.xl,
  );

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
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.appLogoRow}>
          <View style={styles.appLogoCircle}>
            <Ionicons name="car-sport" size={24} color="#b91c1c" />
            <View style={styles.appLogoWrench}>
              <Ionicons name="build" size={10} color={colors.text.inverse} />
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
          <Ionicons
            name="person-outline"
            size={20}
            color={colors.text.primary}
          />
        </Pressable>
      </View>

      {/* Tab Navigation - Scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabButton, selected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={18}
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

      {/* Tab Content */}
      {activeTab === "mechanic" && <MechanicTab token={session?.token} />}
      {activeTab === "fuel" && <FuelTab token={session?.token} />}
      {activeTab === "charging" && <ChargingTab token={session?.token} />}
      {activeTab === "requests" && <RequestsTab token={session?.token} />}
      {activeTab === "feedback" && (
        <FeedbackTab token={session?.token} userId={session?.user?._id} />
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
            <ProfileTab
              token={session?.token}
              user={session?.user}
              onClose={() => setShowProfileModal(false)}
              bottomInset={insets.bottom}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const RANGE_OPTIONS = [
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 15000, label: "15 km" },
  { value: 25000, label: "25 km" },
  { value: 50000, label: "50 km" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "cash-outline" },
  { value: "upi", label: "UPI", icon: "phone-portrait-outline" },
  { value: "card", label: "Card", icon: "card-outline" },
];

function MechanicTab({ token }) {
  const [latitude, setLatitude] = useState("12.9716");
  const [longitude, setLongitude] = useState("77.5946");
  const [mechanicType, setMechanicType] = useState("");
  const [searchRange, setSearchRange] = useState(10000);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [problemDescription, setProblemDescription] = useState("");
  const [address, setAddress] = useState("");
  const [problemImage, setProblemImage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Permission to access gallery denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProblemImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Permission to access camera denied");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProblemImage(result.assets[0].uri);
    }
  };

  const detectLocation = async () => {
    setLocationLoading(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(String(location.coords.latitude.toFixed(6)));
      setLongitude(String(location.coords.longitude.toFixed(6)));
    } catch (err) {
      setError("Could not detect location");
    } finally {
      setLocationLoading(false);
    }
  };

  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mechanicAPI.getNearby(
        Number(longitude),
        Number(latitude),
        searchRange,
        { mechanicType: mechanicType || undefined },
      );
      setList(res?.data || []);
      if ((res?.data || []).length === 0) {
        setError(
          `No mechanics found within ${searchRange / 1000} km. Try increasing the search range.`,
        );
      }
    } catch (err) {
      setError(err.message || "Could not load mechanics");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!selectedProvider || !problemDescription) {
      setError("Please describe your problem");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await userAPI.createMechanicRequest(token, {
        mechanicId: selectedProvider._id,
        problemDescription,
        images: problemImage ? [problemImage] : undefined,
        address: address || "GPS Location",
        paymentMethod,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      });
      setSuccess("Request sent! The mechanic will respond shortly.");
      setProblemDescription("");
      setAddress("");
      setProblemImage(null);
      setPaymentMethod("cash");
      setShowRequestModal(false);
      setSelectedProvider(null);
    } catch (err) {
      setError(err.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (provider) => {
    setSelectedProvider(provider);
    setProblemImage(null);
    setShowRequestModal(true);
    setError("");
    setSuccess("");
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      {/* Location Input */}
      <Card>
        <View style={styles.locationHeader}>
          <IconCircle
            icon="location-outline"
            color={colors.brand.primary}
            size={36}
          />
          <View style={styles.locationHeaderText}>
            <Text style={styles.cardTitle}>Your Location</Text>
            <Text style={styles.cardSubtitle}>
              Detect automatically or enter manually
            </Text>
          </View>
        </View>

        {/* GPS Detection Button */}
        <Pressable
          style={[
            styles.gpsButton,
            locationLoading && styles.gpsButtonDisabled,
          ]}
          onPress={locationLoading ? null : detectLocation}
        >
          <Ionicons
            name="navigate-outline"
            size={18}
            color={locationLoading ? colors.text.muted : colors.brand.primary}
          />
          <Text
            style={[
              styles.gpsButtonText,
              locationLoading && { color: colors.text.muted },
            ]}
          >
            {locationLoading ? "Detecting..." : "Detect My Location"}
          </Text>
          {locationLoading && (
            <ActivityIndicator size="small" color={colors.brand.primary} />
          )}
        </Pressable>

        <View style={styles.locationInputs}>
          <View style={styles.coordInput}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />
          </View>
          <View style={styles.coordInput}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />
          </View>
        </View>
      </Card>

      {/* Mechanic Type Filter */}
      <Text style={styles.filterLabel}>Filter by Vehicle Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {MECHANIC_TYPES.map((type) => (
          <FilterChip
            key={type.id}
            label={type.label}
            icon={type.emoji}
            selected={mechanicType === type.id}
            onPress={() => setMechanicType(type.id)}
          />
        ))}
      </ScrollView>

      {/* Search Range */}
      <Text style={styles.filterLabel}>Search Range</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {RANGE_OPTIONS.map((range) => (
          <FilterChip
            key={range.value}
            label={range.label}
            icon="📍"
            selected={searchRange === range.value}
            onPress={() => setSearchRange(range.value)}
          />
        ))}
      </ScrollView>

      {/* Search Button */}
      <Button
        title="Search Nearby Mechanics"
        icon="search-outline"
        onPress={search}
        loading={loading}
        style={styles.searchButton}
      />

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {/* Results */}
      <SectionTitle>Available Mechanics ({list.length})</SectionTitle>

      {loading && (
        <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
      )}

      {!loading && list.length === 0 && (
        <EmptyState
          icon="construct-outline"
          title="No mechanics found"
          message="Try adjusting your location or filters"
        />
      )}

      {list.map((item) => (
        <MechanicCard
          key={item._id}
          mechanic={item}
          onRequest={() => openRequestModal(item)}
        />
      ))}

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Assistance</Text>
              <Pressable onPress={() => setShowRequestModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            {selectedProvider && (
              <View style={styles.selectedProviderInfo}>
                <IconCircle
                  icon="construct"
                  color={colors.brand.emerald}
                  size={44}
                />
                <View style={styles.selectedProviderText}>
                  <Text style={styles.selectedProviderName}>
                    {selectedProvider.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <RatingStars
                      rating={selectedProvider.rating || 0}
                      size={14}
                    />
                    <Text style={styles.ratingText}>
                      ({selectedProvider.totalRatings || 0})
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Describe your problem *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={problemDescription}
              onChangeText={setProblemDescription}
              placeholder="e.g., Flat tire, engine won't start..."
              placeholderTextColor={colors.text.muted}
              multiline={true}
              numberOfLines={4}
            />

            {/* Image Picker */}
            <Text style={styles.inputLabel}>Add Photo (optional)</Text>
            <View style={styles.imagePickerRow}>
              <Pressable style={styles.imagePickerBtn} onPress={takePhoto}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={colors.brand.primary}
                />
                <Text style={styles.imagePickerText}>Camera</Text>
              </Pressable>
              <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={colors.brand.primary}
                />
                <Text style={styles.imagePickerText}>Gallery</Text>
              </Pressable>
            </View>
            {problemImage && (
              <View style={styles.imagePreviewWrap}>
                <Image
                  source={{ uri: problemImage }}
                  style={styles.imagePreview}
                />
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => setProblemImage(null)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            )}

            <Text style={styles.inputLabel}>Address (optional)</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor={colors.text.muted}
            />
            <View style={styles.gpsHintRow}>
              <Ionicons name="location" size={12} color={colors.text.muted} />
              <Text style={styles.gpsHint}>GPS location will be used if left empty</Text>
            </View>

            {/* Payment Method Selection */}
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentMethodsWrap}>
              {PAYMENT_METHODS.map((method) => (
                <Pressable
                  key={method.value}
                  style={[
                    styles.paymentMethodBtn,
                    paymentMethod === method.value &&
                      styles.paymentMethodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <Ionicons
                    name={method.icon}
                    size={18}
                    color={
                      paymentMethod === method.value
                        ? colors.text.inverse
                        : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.value &&
                        styles.paymentMethodTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ErrorMessage message={error} />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowRequestModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Send Request"
                icon="send-outline"
                onPress={sendRequest}
                loading={loading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MechanicCard({ mechanic, onRequest }) {
  const typeEmoji = {
    car: "🚗",
    bus_truck: "🚛",
    bike: "🏍️",
  };

  return (
    <Card style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <IconCircle icon="construct" color={colors.brand.emerald} size={44} />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{mechanic.name}</Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={mechanic.rating || 0} size={14} />
            <Text style={styles.ratingText}>
              ({mechanic.totalRatings || 0})
            </Text>
          </View>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeEmoji}>
            {typeEmoji[mechanic.mechanicType] || "🔧"}
          </Text>
          <Text style={styles.typeText}>{mechanic.mechanicType}</Text>
        </View>
      </View>

      <View style={styles.providerDetails}>
        <InfoRow
          icon="call-outline"
          label="Phone"
          value={mechanic.phone || "N/A"}
        />
        <InfoRow
          icon="briefcase-outline"
          label="Experience"
          value={`${mechanic.experience || 0} years`}
        />
        <InfoRow
          icon="navigate-outline"
          label="Service Radius"
          value={`${mechanic.serviceRadius || 10} km`}
        />
      </View>

      {mechanic.servicesOffered?.length > 0 && (
        <View style={styles.servicesWrap}>
          {mechanic.servicesOffered.slice(0, 3).map((service, idx) => (
            <View key={idx} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
          {mechanic.servicesOffered.length > 3 && (
            <Text style={styles.moreServices}>
              +{mechanic.servicesOffered.length - 3} more
            </Text>
          )}
        </View>
      )}

      <Button
        title="Request Assistance"
        icon="hand-right-outline"
        onPress={onRequest}
        variant="emerald"
        style={styles.requestButton}
      />
    </Card>
  );
}

function FuelTab({ token }) {
  const [latitude, setLatitude] = useState("12.9716");
  const [longitude, setLongitude] = useState("77.5946");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("");
  const [searchRange, setSearchRange] = useState(10000);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState("10");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const detectLocation = async () => {
    setLocationLoading(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(String(location.coords.latitude.toFixed(6)));
      setLongitude(String(location.coords.longitude.toFixed(6)));
    } catch (err) {
      setError("Could not detect location");
    } finally {
      setLocationLoading(false);
    }
  };

  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fuelStationAPI.getNearby(
        Number(longitude),
        Number(latitude),
        searchRange,
        { fuelType: fuelTypeFilter || undefined },
      );
      setList(res?.data || []);
      if ((res?.data || []).length === 0) {
        setError(
          `No fuel stations found within ${searchRange / 1000} km. Try increasing the search range.`,
        );
      }
    } catch (err) {
      setError(err.message || "Could not load fuel stations");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!selectedProvider) {
      setError("Select a fuel station");
      return;
    }

    const selectedFuel = selectedProvider.fuelTypes?.find(
      (f) => f.type === fuelType,
    );
    if (!selectedFuel) {
      setError("Selected fuel type not available at this station");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await userAPI.createFuelRequest(token, {
        fuelStationId: selectedProvider._id,
        fuelType,
        quantity: Number(quantity),
        pricePerLiter: selectedFuel.price,
        deliveryCharges: selectedProvider.deliveryCharges || 0,
        totalPrice:
          Number(quantity) * selectedFuel.price +
          (selectedProvider.deliveryCharges || 0),
        address: address || "GPS Location",
        paymentMethod,
        deliveryLocation: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      });
      setSuccess("Fuel request submitted! Track it in Requests tab.");
      setShowRequestModal(false);
      setSelectedProvider(null);
      setPaymentMethod("cash");
    } catch (err) {
      setError(err.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (provider) => {
    setSelectedProvider(provider);
    const availableFuel = provider.fuelTypes?.find((f) => f.available);
    if (availableFuel) setFuelType(availableFuel.type);
    setShowRequestModal(true);
    setError("");
    setSuccess("");
  };

  const selectedFuelPrice =
    selectedProvider?.fuelTypes?.find((f) => f.type === fuelType)?.price || 0;
  const totalPrice =
    Number(quantity) * selectedFuelPrice +
    (selectedProvider?.deliveryCharges || 0);

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      {/* Location Input */}
      <Card>
        <View style={styles.locationHeader}>
          <IconCircle
            icon="location-outline"
            color={colors.brand.cyan}
            size={36}
          />
          <View style={styles.locationHeaderText}>
            <Text style={styles.cardTitle}>Delivery Location</Text>
            <Text style={styles.cardSubtitle}>Where should we deliver?</Text>
          </View>
        </View>

        {/* GPS Detection Button */}
        <Pressable
          style={[
            styles.gpsButton,
            locationLoading && styles.gpsButtonDisabled,
          ]}
          onPress={locationLoading ? null : detectLocation}
        >
          <Ionicons
            name="navigate-outline"
            size={18}
            color={locationLoading ? colors.text.muted : colors.brand.cyan}
          />
          <Text
            style={[
              styles.gpsButtonText,
              locationLoading && { color: colors.text.muted },
            ]}
          >
            {locationLoading ? "Detecting..." : "Detect My Location"}
          </Text>
          {locationLoading && (
            <ActivityIndicator size="small" color={colors.brand.cyan} />
          )}
        </Pressable>

        <View style={styles.locationInputs}>
          <View style={styles.coordInput}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />
          </View>
          <View style={styles.coordInput}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />
          </View>
        </View>
      </Card>

      {/* Fuel Type Filter */}
      <Text style={styles.filterLabel}>Filter by Fuel Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {FUEL_TYPES.map((type) => (
          <FilterChip
            key={type.id}
            label={type.label}
            icon={type.emoji}
            selected={fuelTypeFilter === type.id}
            onPress={() => setFuelTypeFilter(type.id)}
          />
        ))}
      </ScrollView>

      {/* Search Range */}
      <Text style={styles.filterLabel}>Search Range</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {RANGE_OPTIONS.map((range) => (
          <FilterChip
            key={range.value}
            label={range.label}
            icon="📍"
            selected={searchRange === range.value}
            onPress={() => setSearchRange(range.value)}
          />
        ))}
      </ScrollView>

      {/* Search Button */}
      <Button
        title="Search Fuel Stations"
        icon="search-outline"
        onPress={search}
        loading={loading}
        variant="primary"
        style={styles.searchButton}
      />

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {/* Results */}
      <SectionTitle>Nearby Fuel Stations ({list.length})</SectionTitle>

      {loading && (
        <ActivityIndicator color={colors.brand.cyan} style={styles.loader} />
      )}

      {!loading && list.length === 0 && (
        <EmptyState
          icon="flame-outline"
          title="No fuel stations found"
          message="Try adjusting your location or filters"
        />
      )}

      {list.map((item) => (
        <FuelStationCard
          key={item._id}
          station={item}
          onOrder={() => openRequestModal(item)}
        />
      ))}

      {/* Order Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Fuel</Text>
              <Pressable onPress={() => setShowRequestModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.modalScrollContent,
                styles.orderModalScrollContent,
              ]}
            >
              {selectedProvider && (
                <View style={styles.selectedProviderInfo}>
                  <IconCircle
                    icon="flame"
                    color={colors.brand.cyan}
                    size={44}
                  />
                  <View style={styles.selectedProviderText}>
                    <Text style={styles.selectedProviderName}>
                      {selectedProvider.stationName}
                    </Text>
                    <View style={styles.ratingRow}>
                      <RatingStars
                        rating={selectedProvider.rating || 0}
                        size={14}
                      />
                      <Text style={styles.ratingText}>
                        ({selectedProvider.totalRatings || 0})
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Fuel Type</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={fuelType}
                  onValueChange={setFuelType}
                  style={styles.picker}
                  dropdownIconColor={colors.text.secondary}
                  mode="dropdown"
                >
                  {selectedProvider?.fuelTypes
                    ?.filter((f) => f.available)
                    .map((f) => (
                      <Picker.Item
                        key={f.type}
                        label={`${f.type} - ₹${f.price}/L`}
                        value={f.type}
                        style={styles.pickerItem}
                      />
                    ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Quantity (Liters)</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Enter quantity"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Delivery address"
                placeholderTextColor={colors.text.muted}
              />
              <View style={styles.gpsHintRow}>
                <Ionicons name="location" size={12} color={colors.text.muted} />
                <Text style={styles.gpsHint}>GPS location will be used if left empty</Text>
              </View>

              {/* Payment Method Selection */}
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_METHODS.map((method) => (
                  <Pressable
                    key={method.value}
                    style={[
                      styles.paymentMethodBtn,
                      paymentMethod === method.value &&
                        styles.paymentMethodBtnActive,
                    ]}
                    onPress={() => setPaymentMethod(method.value)}
                  >
                    <Ionicons
                      name={method.icon}
                      size={18}
                      color={
                        paymentMethod === method.value
                          ? colors.text.inverse
                          : colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        paymentMethod === method.value &&
                          styles.paymentMethodTextActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Price Summary */}
              <View style={styles.priceSummary}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Fuel ({quantity}L × ₹{selectedFuelPrice})
                  </Text>
                  <Text style={styles.priceValue}>
                    ₹{(Number(quantity) * selectedFuelPrice).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Charges</Text>
                  <Text style={styles.priceValue}>
                    ₹{selectedProvider?.deliveryCharges || 0}
                  </Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ₹{totalPrice.toFixed(2)}
                  </Text>
                </View>
              </View>

              <ErrorMessage message={error} />

              <View style={[styles.modalButtons, styles.orderModalButtons]}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowRequestModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Place Order"
                  icon="cart-outline"
                  onPress={sendRequest}
                  loading={loading}
                  variant="primary"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function FuelStationCard({ station, onOrder }) {
  return (
    <Card style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <IconCircle icon="flame" color={colors.brand.cyan} size={44} />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{station.stationName}</Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={station.rating || 0} size={14} />
            <Text style={styles.ratingText}>({station.totalRatings || 0})</Text>
          </View>
        </View>
        {station.deliveryAvailable && (
          <View
            style={[
              styles.typeTag,
              { backgroundColor: "rgba(16, 185, 129, 0.1)" },
            ]}
          >
            <Ionicons name="car-outline" size={14} color={colors.success} />
            <Text style={[styles.typeText, { color: colors.success }]}>
              Delivery
            </Text>
          </View>
        )}
      </View>

      <View style={styles.providerDetails}>
        <InfoRow
          icon="call-outline"
          label="Phone"
          value={station.phone || "N/A"}
        />
        <InfoRow
          icon="time-outline"
          label="Hours"
          value={station.openingHours || "24 Hours"}
        />
        {station.deliveryAvailable && (
          <InfoRow
            icon="navigate-outline"
            label="Delivery Radius"
            value={`${station.deliveryRadius || 0} km`}
          />
        )}
      </View>

      {/* Fuel Prices */}
      <View style={styles.fuelPricesWrap}>
        {station.fuelTypes?.map((fuel) => (
          <View
            key={fuel.type}
            style={[
              styles.fuelPriceTag,
              !fuel.available && styles.fuelPriceUnavailable,
            ]}
          >
            <Text style={styles.fuelPriceType}>{fuel.type}</Text>
            <Text style={styles.fuelPriceValue}>₹{fuel.price}</Text>
            {!fuel.available && <Text style={styles.fuelPriceNA}>N/A</Text>}
          </View>
        ))}
      </View>

      {/* Service Details */}
      <View style={styles.serviceDetailsWrap}>
        <View style={styles.serviceDetailItem}>
          <Ionicons name="cash-outline" size={14} color={colors.text.muted} />
          <Text style={styles.serviceDetailText}>
            Delivery: ₹{station.deliveryCharges || 0}
          </Text>
        </View>
        <View style={styles.serviceDetailItem}>
          <Ionicons name="cart-outline" size={14} color={colors.text.muted} />
          <Text style={styles.serviceDetailText}>
            {`Min: ${
              station.minimumOrder
                ? `₹${station.minimumOrder}`
                : `${station.minimumQuantity || 5}L`
            }`}
          </Text>
        </View>
        <View style={styles.serviceDetailItem}>
          <Ionicons name="card-outline" size={14} color={colors.text.muted} />
          <Text style={styles.serviceDetailText}>
            {station.paymentMethods?.join(", ") || "Cash, UPI"}
          </Text>
        </View>
      </View>

      <Button
        title="Order Fuel"
        icon="cart-outline"
        onPress={onOrder}
        variant="primary"
        style={styles.requestButton}
      />
    </Card>
  );
}

function ChargingTab({ token }) {
  const [latitude, setLatitude] = useState("12.9716");
  const [longitude, setLongitude] = useState("77.5946");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [connectorFilter, setConnectorFilter] = useState("");
  const [searchRange, setSearchRange] = useState(15000);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [vehicleType, setVehicleType] = useState("4-wheeler");
  const [connectorType, setConnectorType] = useState("CCS2");
  const [currentBatteryPercent, setCurrentBatteryPercent] = useState("20");
  const [targetBatteryPercent, setTargetBatteryPercent] = useState("80");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const detectLocation = async () => {
    setLocationLoading(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(String(location.coords.latitude.toFixed(6)));
      setLongitude(String(location.coords.longitude.toFixed(6)));
    } catch (err) {
      setError("Could not detect location");
    } finally {
      setLocationLoading(false);
    }
  };

  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chargingStationAPI.getNearby(
        Number(longitude),
        Number(latitude),
        searchRange,
        {
          vehicleType: vehicleTypeFilter || undefined,
          connectorType: connectorFilter || undefined,
        },
      );
      setList(res?.data || []);
      if ((res?.data || []).length === 0) {
        setError(
          `No charging stations found within ${searchRange / 1000} km. Try increasing the search range.`,
        );
      }
    } catch (err) {
      setError(err.message || "Could not load charging stations");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!selectedProvider) {
      setError("Select a charging station");
      return;
    }

    const chargingType = selectedProvider.chargingTypes?.find(
      (ct) =>
        ct.vehicleType === vehicleType && ct.connectorType === connectorType,
    );

    if (!chargingType) {
      setError("Selected charging configuration not available");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await userAPI.createChargingRequest(token, {
        chargingStationId: selectedProvider._id,
        vehicleType,
        connectorType,
        currentBatteryPercent: Number(currentBatteryPercent),
        targetBatteryPercent: Number(targetBatteryPercent),
        pricePerKwh: chargingType.pricePerKwh,
        serviceCharges: selectedProvider.serviceCharges || 0,
        address: address || "GPS Location",
        paymentMethod,
        deliveryLocation: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      });

      setSuccess("Charging request submitted! Track it in Requests tab.");
      setShowRequestModal(false);
      setSelectedProvider(null);
      setPaymentMethod("upi");
    } catch (err) {
      setError(err.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (provider) => {
    setSelectedProvider(provider);
    const availableType = provider.chargingTypes?.find((ct) => ct.available);
    if (availableType) {
      setVehicleType(availableType.vehicleType);
      setConnectorType(availableType.connectorType);
    }
    setShowRequestModal(true);
    setError("");
    setSuccess("");
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      {/* Location Input */}
      <Card>
        <View style={styles.locationHeader}>
          <IconCircle
            icon="location-outline"
            color={colors.brand.emerald}
            size={36}
          />
          <View style={styles.locationHeaderText}>
            <Text style={styles.cardTitle}>Charging Location</Text>
            <Text style={styles.cardSubtitle}>Where is your vehicle?</Text>
          </View>
        </View>

        {/* GPS Detection Button */}
        <Pressable
          style={[
            styles.gpsButton,
            locationLoading && styles.gpsButtonDisabled,
          ]}
          onPress={locationLoading ? null : detectLocation}
        >
          <Ionicons
            name="navigate-outline"
            size={18}
            color={locationLoading ? colors.text.muted : colors.brand.emerald}
          />
          <Text
            style={[
              styles.gpsButtonText,
              locationLoading && { color: colors.text.muted },
            ]}
          >
            {locationLoading ? "Detecting..." : "Detect My Location"}
          </Text>
          {locationLoading && (
            <ActivityIndicator size="small" color={colors.brand.emerald} />
          )}
        </Pressable>

        <View style={styles.locationInputs}>
          <View style={styles.coordInput}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />
          </View>
          <View style={styles.coordInput}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              placeholderTextColor={colors.text.muted}
            />
          </View>
        </View>
      </Card>

      {/* Vehicle Type Filter */}
      <Text style={styles.filterLabel}>Vehicle Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {VEHICLE_TYPES.map((type) => (
          <FilterChip
            key={type.id}
            label={type.label}
            icon={type.emoji}
            selected={vehicleTypeFilter === type.id}
            onPress={() => setVehicleTypeFilter(type.id)}
          />
        ))}
      </ScrollView>

      {/* Connector Type Filter */}
      <Text style={styles.filterLabel}>Connector Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {CONNECTOR_TYPES.map((type) => (
          <FilterChip
            key={type.id}
            label={type.label}
            icon={type.emoji}
            selected={connectorFilter === type.id}
            onPress={() => setConnectorFilter(type.id)}
          />
        ))}
      </ScrollView>

      {/* Search Range */}
      <Text style={styles.filterLabel}>Search Range</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {RANGE_OPTIONS.map((range) => (
          <FilterChip
            key={range.value}
            label={range.label}
            icon="📍"
            selected={searchRange === range.value}
            onPress={() => setSearchRange(range.value)}
          />
        ))}
      </ScrollView>

      {/* Search Button */}
      <Button
        title="Search Charging Stations"
        icon="search-outline"
        onPress={search}
        loading={loading}
        variant="emerald"
        style={styles.searchButton}
      />

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {/* Results */}
      <SectionTitle>Nearby EV Charging ({list.length})</SectionTitle>

      {loading && (
        <ActivityIndicator color={colors.brand.emerald} style={styles.loader} />
      )}

      {!loading && list.length === 0 && (
        <EmptyState
          icon="flash-outline"
          title="No charging stations found"
          message="Try adjusting your location or filters"
        />
      )}

      {list.map((item) => (
        <ChargingStationCard
          key={item._id}
          station={item}
          onRequest={() => openRequestModal(item)}
        />
      ))}

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Mobile Charging</Text>
              <Pressable onPress={() => setShowRequestModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.modalScrollContent,
                styles.orderModalScrollContent,
              ]}
            >
              {selectedProvider && (
                <View style={styles.selectedProviderInfo}>
                  <IconCircle
                    icon="flash"
                    color={colors.brand.emerald}
                    size={44}
                  />
                  <View style={styles.selectedProviderText}>
                    <Text style={styles.selectedProviderName}>
                      {selectedProvider.stationName}
                    </Text>
                    <View style={styles.ratingRow}>
                      <RatingStars
                        rating={selectedProvider.rating || 0}
                        size={14}
                      />
                      <Text style={styles.ratingText}>
                        ({selectedProvider.totalRatings || 0})
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={vehicleType}
                  onValueChange={setVehicleType}
                  style={styles.picker}
                  dropdownIconColor={colors.text.secondary}
                  mode="dropdown"
                >
                  {["2-wheeler", "3-wheeler", "4-wheeler", "commercial"].map(
                    (v) => (
                      <Picker.Item
                        key={v}
                        label={v}
                        value={v}
                        style={styles.pickerItem}
                      />
                    ),
                  )}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Connector Type</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={connectorType}
                  onValueChange={setConnectorType}
                  style={styles.picker}
                  dropdownIconColor={colors.text.secondary}
                  mode="dropdown"
                >
                  {["Type2", "CCS2", "CHAdeMO", "GBT"].map((c) => (
                    <Picker.Item
                      key={c}
                      label={c}
                      value={c}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.batteryInputs}>
                <View style={styles.batteryInput}>
                  <Text style={styles.inputLabel}>Current Battery %</Text>
                  <TextInput
                    style={styles.input}
                    value={currentBatteryPercent}
                    onChangeText={setCurrentBatteryPercent}
                    keyboardType="numeric"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
                <View style={styles.batteryInput}>
                  <Text style={styles.inputLabel}>Target Battery %</Text>
                  <TextInput
                    style={styles.input}
                    value={targetBatteryPercent}
                    onChangeText={setTargetBatteryPercent}
                    keyboardType="numeric"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>

              {/* Battery Visual */}
              <View style={styles.batteryVisual}>
                <View style={styles.batteryIcon}>
                  <View
                    style={[
                      styles.batteryFill,
                      {
                        width: `${currentBatteryPercent}%`,
                        backgroundColor: colors.error,
                      },
                    ]}
                  />
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.text.muted}
                />
                <View style={styles.batteryIcon}>
                  <View
                    style={[
                      styles.batteryFill,
                      {
                        width: `${targetBatteryPercent}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Your location"
                placeholderTextColor={colors.text.muted}
              />
              <View style={styles.gpsHintRow}>
                <Ionicons name="location" size={12} color={colors.text.muted} />
                <Text style={styles.gpsHint}>GPS location will be used if left empty</Text>
              </View>

              {/* Payment Method Selection */}
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_METHODS.map((method) => (
                  <Pressable
                    key={method.value}
                    style={[
                      styles.paymentMethodBtn,
                      paymentMethod === method.value &&
                        styles.paymentMethodBtnActive,
                    ]}
                    onPress={() => setPaymentMethod(method.value)}
                  >
                    <Ionicons
                      name={method.icon}
                      size={18}
                      color={
                        paymentMethod === method.value
                          ? colors.text.inverse
                          : colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        paymentMethod === method.value &&
                          styles.paymentMethodTextActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ErrorMessage message={error} />

              <View style={[styles.modalButtons, styles.orderModalButtons]}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowRequestModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Request Charging"
                  icon="flash-outline"
                  onPress={sendRequest}
                  loading={loading}
                  variant="emerald"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ChargingStationCard({ station, onRequest }) {
  return (
    <Card style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <IconCircle icon="flash" color={colors.brand.emerald} size={44} />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{station.stationName}</Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={station.rating || 0} size={14} />
            <Text style={styles.ratingText}>({station.totalRatings || 0})</Text>
          </View>
        </View>
        {station.mobileChargingAvailable && (
          <View
            style={[
              styles.typeTag,
              { backgroundColor: "rgba(16, 185, 129, 0.1)" },
            ]}
          >
            <Ionicons name="car-outline" size={14} color={colors.success} />
            <Text style={[styles.typeText, { color: colors.success }]}>
              Mobile
            </Text>
          </View>
        )}
      </View>

      <View style={styles.providerDetails}>
        <InfoRow
          icon="call-outline"
          label="Phone"
          value={station.phone || "N/A"}
        />
        <InfoRow
          icon="time-outline"
          label="Response Time"
          value={`~${station.estimatedResponseTime || 30} min`}
        />
        <InfoRow
          icon="navigate-outline"
          label="Service Radius"
          value={`${station.serviceRadius || 25} km`}
        />
        <InfoRow
          icon="cash-outline"
          label="Service Fee"
          value={`₹${station.serviceCharges || 0}`}
        />
      </View>

      {/* Charging Types */}
      <View style={styles.chargingTypesWrap}>
        {station.chargingTypes?.slice(0, 4).map((ct, idx) => (
          <View
            key={idx}
            style={[
              styles.chargingTypeTag,
              !ct.available && styles.chargingTypeUnavailable,
            ]}
          >
            <Text style={styles.chargingTypeVehicle}>{ct.vehicleType}</Text>
            <Text style={styles.chargingTypeConnector}>{ct.connectorType}</Text>
            <Text style={styles.chargingTypePrice}>₹{ct.pricePerKwh}/kWh</Text>
          </View>
        ))}
      </View>

      {/* Service Details */}
      <View style={styles.serviceDetailsWrap}>
        <View style={styles.serviceDetailItem}>
          <Ionicons name="card-outline" size={14} color={colors.text.muted} />
          <Text style={styles.serviceDetailText}>
            {station.paymentMethods?.join(", ") || "Cash, UPI, Card"}
          </Text>
        </View>
      </View>

      <Button
        title="Request Mobile Charging"
        icon="flash-outline"
        onPress={onRequest}
        variant="emerald"
        style={styles.requestButton}
      />
    </Card>
  );
}

function RequestsTab({ token }) {
  const [mechanicRequests, setMechanicRequests] = useState([]);
  const [fuelRequests, setFuelRequests] = useState([]);
  const [chargingRequests, setChargingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const { requestStatus } = useSocket();

  // Refresh requests when status updates via socket
  useEffect(() => {
    if (requestStatus) {
      loadRequests();
    }
  }, [requestStatus]);

  const merged = useMemo(() => {
    const normalize = (type, items = []) =>
      items.map((item) => ({ ...item, requestType: type }));

    let all = [
      ...normalize("mechanic", mechanicRequests),
      ...normalize("fuel", fuelRequests),
      ...normalize("charging", chargingRequests),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filter === "active") {
      all = all.filter(
        (r) => !["completed", "delivered", "cancelled"].includes(r.status),
      );
    } else if (filter === "completed") {
      all = all.filter((r) => ["completed", "delivered"].includes(r.status));
    }

    return all;
  }, [mechanicRequests, fuelRequests, chargingRequests, filter]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mechanicRes, fuelRes, chargingRes] = await Promise.all([
        userAPI.getMyMechanicRequests(token),
        userAPI.getMyFuelRequests(token),
        userAPI.getMyChargingRequests(token),
      ]);

      setMechanicRequests(mechanicRes?.data || []);
      setFuelRequests(fuelRes?.data || []);
      setChargingRequests(chargingRes?.data || []);
    } catch (err) {
      setError(err.message || "Could not load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const cancelRequest = async (requestType, id) => {
    setLoading(true);
    setError("");
    try {
      if (requestType === "mechanic") {
        await userAPI.cancelMechanicRequest(token, id);
      } else if (requestType === "fuel") {
        await userAPI.cancelFuelRequest(token, id);
      } else {
        await userAPI.cancelChargingRequest(token, id);
      }
      await loadRequests();
    } catch (err) {
      setError(err.message || "Cancel failed");
      setLoading(false);
    }
  };

  const getRequestIcon = (type) => {
    switch (type) {
      case "mechanic":
        return "construct-outline";
      case "fuel":
        return "flame-outline";
      case "charging":
        return "flash-outline";
      default:
        return "document-outline";
    }
  };

  const getRequestColor = (type) => {
    switch (type) {
      case "mechanic":
        return colors.brand.emerald;
      case "fuel":
        return colors.brand.amber;
      case "charging":
        return colors.brand.primary;
      default:
        return colors.text.muted;
    }
  };

  return (
    <View style={styles.body}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Done" },
        ].map((f) => (
          <Pressable
            key={f.id}
            style={[
              styles.filterTab,
              filter === f.id && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.id)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f.id && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ErrorMessage message={error} />

      <FlatList
        data={merged}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.requestList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.brand.primary}
              style={styles.loader}
            />
          ) : (
            <EmptyState
              icon="document-outline"
              title="No requests yet"
              message="Your service requests will appear here"
            />
          )
        }
        renderItem={({ item }) => {
          const canCancel = ["pending", "accepted", "confirmed"].includes(
            item.status,
          );
          const icon = getRequestIcon(item.requestType);
          const color = getRequestColor(item.requestType);

          return (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <IconCircle icon={icon} color={color} size={40} />
                <View style={styles.requestHeaderInfo}>
                  <Text style={styles.requestType}>
                    {`${item.requestType.charAt(0).toUpperCase()}${item.requestType.slice(1)} Request`}
                  </Text>
                  <Text style={styles.requestDate}>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {/* Request Details */}
              <View style={styles.requestDetails}>
                {item.requestType === "mechanic" && (
                  <>
                    <InfoRow
                      label="Mechanic"
                      value={item.mechanic?.name || "Pending"}
                    />
                    <InfoRow
                      label="Problem"
                      value={item.problemDescription?.slice(0, 50) || "N/A"}
                    />
                  </>
                )}
                {item.requestType === "fuel" && (
                  <>
                    <InfoRow
                      label="Station"
                      value={item.fuelStation?.stationName || "Pending"}
                    />
                    <InfoRow
                      label="Fuel"
                      value={`${item.quantity}L ${item.fuelType}`}
                    />
                    <InfoRow label="Total" value={`₹${item.totalPrice || 0}`} />
                    {item.deliveryPersonName && (
                      <InfoRow
                        label="Delivery Person"
                        value={item.deliveryPersonName}
                      />
                    )}
                    {item.deliveryPersonPhone && (
                      <InfoRow
                        label="Delivery Phone"
                        value={item.deliveryPersonPhone}
                      />
                    )}
                    {item.vehicleNumber && (
                      <InfoRow label="Vehicle No." value={item.vehicleNumber} />
                    )}
                  </>
                )}
                {item.requestType === "charging" && (
                  <>
                    <InfoRow
                      label="Station"
                      value={item.chargingStation?.stationName || "Pending"}
                    />
                    <InfoRow label="Vehicle" value={item.vehicleType} />
                    <InfoRow
                      label="Battery"
                      value={`${item.currentBatteryPercent}% → ${item.targetBatteryPercent}%`}
                    />
                    {item.technicianName && (
                      <InfoRow label="Technician" value={item.technicianName} />
                    )}
                    {item.technicianPhone && (
                      <InfoRow
                        label="Technician Phone"
                        value={item.technicianPhone}
                      />
                    )}
                    {item.vehicleNumber && (
                      <InfoRow label="Vehicle No." value={item.vehicleNumber} />
                    )}
                  </>
                )}
              </View>

              {/* Provider Contact - Show delivery person/technician phone if available, else station phone */}
              {(item.mechanic?.phone ||
                item.deliveryPersonPhone ||
                item.technicianPhone ||
                item.fuelStation?.phone ||
                item.chargingStation?.phone) && (
                <View style={styles.contactRow}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={colors.text.muted}
                  />
                  <Text style={styles.contactText}>
                    {item.mechanic?.phone ||
                      item.deliveryPersonPhone ||
                      item.technicianPhone ||
                      item.fuelStation?.phone ||
                      item.chargingStation?.phone}
                  </Text>
                </View>
              )}

              {/* Track Button - show for trackable statuses */}
              {isRequestTrackable(item.requestType, item.status) && (
                <Button
                  title="Track Live Location"
                  icon="location-outline"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                  style={styles.trackButton}
                />
              )}

              {canCancel && (
                <Button
                  title="Cancel Request"
                  icon="close-circle-outline"
                  variant="danger"
                  size="sm"
                  onPress={() => cancelRequest(item.requestType, item._id)}
                  style={styles.cancelButton}
                />
              )}
            </Card>
          );
        }}
      />

      {/* Tracking Modal */}
      <TrackingModal
        visible={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setTrackingRequest(null);
        }}
        request={trackingRequest}
        requestType={trackingRequest?.requestType}
        isProvider={false}
      />
    </View>
  );
}

// ============== FEEDBACK TAB ==============
function FeedbackTab({ token, userId }) {
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // For creating new feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Completed requests without feedback
  const [completedRequests, setCompletedRequests] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Load user's feedback
      const feedbackRes = await feedbackAPI.getMyFeedback(token);
      setMyFeedback(feedbackRes?.data || []);

      // Load completed requests to check which need feedback
      const [mechanicRes, fuelRes, chargingRes] = await Promise.all([
        userAPI.getMyMechanicRequests(token),
        userAPI.getMyFuelRequests(token),
        userAPI.getMyChargingRequests(token),
      ]);

      const feedbackRequestIds = new Set(
        (feedbackRes?.data || []).map((f) => f.request?._id || f.request),
      );

      const completed = [
        ...(mechanicRes?.data || [])
          .filter(
            (r) => r.status === "completed" && !feedbackRequestIds.has(r._id),
          )
          .map((r) => ({
            ...r,
            requestType: "mechanic",
            serviceType: "Mechanic",
            serviceProvider: r.mechanic,
          })),
        ...(fuelRes?.data || [])
          .filter(
            (r) => r.status === "delivered" && !feedbackRequestIds.has(r._id),
          )
          .map((r) => ({
            ...r,
            requestType: "fuel",
            serviceType: "FuelStation",
            serviceProvider: r.fuelStation,
          })),
        ...(chargingRes?.data || [])
          .filter(
            (r) => r.status === "completed" && !feedbackRequestIds.has(r._id),
          )
          .map((r) => ({
            ...r,
            requestType: "charging",
            serviceType: "ChargingStation",
            serviceProvider: r.chargingStation,
          })),
      ];

      setCompletedRequests(completed);
    } catch (err) {
      setError(err.message || "Could not load feedback");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openFeedbackModal = (request) => {
    setSelectedRequest(request);
    setRating(5);
    setComment("");
    setShowFeedbackModal(true);
    setError("");
    setSuccess("");
  };

  const submitFeedback = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    setError("");
    try {
      await feedbackAPI.create(token, {
        serviceProvider: selectedRequest.serviceProvider?._id,
        serviceType: selectedRequest.serviceType,
        request: selectedRequest._id,
        requestType:
          selectedRequest.serviceType === "Mechanic"
            ? "MechanicRequest"
            : selectedRequest.serviceType === "FuelStation"
              ? "FuelRequest"
              : "ChargingRequest",
        rating,
        comment,
      });
      setSuccess("Feedback submitted! Thank you.");
      setShowFeedbackModal(false);
      loadData();
    } catch (err) {
      setError(err.message || "Could not submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.body}>
      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <FlatList
        data={[...completedRequests, ...myFeedback]}
        keyExtractor={(item, idx) => item._id + idx}
        contentContainerStyle={styles.requestList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        ListHeaderComponent={
          completedRequests.length > 0 ? (
            <View style={styles.pendingFeedbackHeader}>
              <Ionicons
                name="star-outline"
                size={20}
                color={colors.brand.primary}
              />
              <Text style={styles.pendingFeedbackText}>
                {completedRequests.length} service(s) need your feedback
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.brand.primary}
              style={styles.loader}
            />
          ) : (
            <EmptyState
              icon="star-outline"
              title="No feedback yet"
              message="Complete a service request to leave feedback"
            />
          )
        }
        renderItem={({ item }) => {
          // Pending feedback item
          if (item.requestType) {
            return (
              <Card style={styles.feedbackPendingCard}>
                <View style={styles.feedbackCardHeader}>
                  <IconCircle
                    icon={
                      item.requestType === "mechanic"
                        ? "construct"
                        : item.requestType === "fuel"
                          ? "flame"
                          : "flash"
                    }
                    color={colors.brand.cyan}
                    size={40}
                  />
                  <View style={styles.feedbackCardInfo}>
                    <Text style={styles.feedbackProviderName}>
                      {item.serviceProvider?.name ||
                        item.serviceProvider?.stationName ||
                        "Service Provider"}
                    </Text>
                    <Text style={styles.feedbackServiceType}>
                      {`${item.serviceType} • ${new Date(item.createdAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                </View>
                <Button
                  title="Leave Feedback"
                  icon="star-outline"
                  variant="primary"
                  onPress={() => openFeedbackModal(item)}
                  style={styles.leaveFeedbackBtn}
                />
              </Card>
            );
          }

          // Existing feedback
          return (
            <Card style={styles.feedbackCard}>
              <View style={styles.feedbackCardHeader}>
                <IconCircle icon="star" color={colors.brand.cyan} size={40} />
                <View style={styles.feedbackCardInfo}>
                  <Text style={styles.feedbackProviderName}>
                    {item.serviceProvider?.name ||
                      item.serviceProvider?.stationName ||
                      "Provider"}
                  </Text>
                  <Text style={styles.feedbackServiceType}>
                    {`${item.serviceType} • ${new Date(item.createdAt).toLocaleDateString()}`}
                  </Text>
                </View>
                <RatingStars rating={item.rating} size={16} />
              </View>
              {item.comment && (
                <Text style={styles.feedbackComment}>"{item.comment}"</Text>
              )}
              {item.response && (
                <View style={styles.feedbackResponse}>
                  <Text style={styles.feedbackResponseLabel}>Response:</Text>
                  <Text style={styles.feedbackResponseText}>
                    {item.response}
                  </Text>
                </View>
              )}
            </Card>
          );
        }}
      />

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <Pressable onPress={() => setShowFeedbackModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            {selectedRequest && (
              <View style={styles.selectedProviderInfo}>
                <IconCircle icon="star" color={colors.brand.cyan} size={44} />
                <View style={styles.selectedProviderText}>
                  <Text style={styles.selectedProviderName}>
                    {selectedRequest.serviceProvider?.name ||
                      selectedRequest.serviceProvider?.stationName}
                  </Text>
                  <Text style={styles.feedbackServiceType}>
                    {selectedRequest.serviceType}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.ratingLabel}>Tap to rate</Text>
            <View style={styles.ratingSelector}>
              <RatingStars
                rating={rating}
                size={36}
                interactive
                onRate={setRating}
              />
            </View>
            <Text style={styles.ratingValue}>{rating} / 5</Text>

            <Text style={styles.inputLabel}>Your feedback (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              placeholderTextColor={colors.text.muted}
              multiline={true}
              numberOfLines={4}
            />

            <ErrorMessage message={error} />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowFeedbackModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Submit Feedback"
                icon="send-outline"
                onPress={submitFeedback}
                loading={loading}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============== PROFILE TAB ==============
function ProfileTab({ token, user, onClose, bottomInset = 0 }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load full profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await userAPI.getProfile(token);
        const p = res?.data || user;
        setProfile(p);
        setName(p?.name || "");
        setPhone(p?.phone || "");
        setAddress(p?.address || "");
      } catch (err) {
        // Fallback to user from auth
        setProfile(user);
        setName(user?.name || "");
        setPhone(user?.phone || "");
        setAddress(user?.address || "");
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [token, user]);

  const updateProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await userAPI.updateProfile(token, { name, phone, address });
      setProfile(res?.data || { ...profile, name, phone, address });
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={{ padding: spacing.xl, alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.modalScrollBody}
      contentContainerStyle={[
        styles.bodyContent,
        { paddingBottom: 40 + bottomInset + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {/* Profile Hero Card */}
      <View style={styles.profileHeroCard}>
        <View style={styles.profileHeroGradient}>
          {/* Decorative circles */}
          <View style={styles.profileDecorCircle1} />
          <View style={styles.profileDecorCircle2} />

          <View style={styles.profileHeroContent}>
            <View style={styles.profileAvatarContainer}>
              <View style={styles.profileHeroAvatar}>
                <Ionicons
                  name="person"
                  size={36}
                  color={colors.brand.primary}
                />
              </View>
              <View style={styles.profileOnlineDot} />
            </View>

            <View style={styles.profileHeroInfo}>
              <Text style={styles.profileHeroName}>
                {profile?.name || "User"}
              </Text>
              <View style={styles.profileHeroRoleBadge}>
                <Ionicons
                  name="person-outline"
                  size={12}
                  color={colors.text.inverse}
                />
                <Text style={styles.profileHeroRoleText}>User Account</Text>
              </View>
            </View>
          </View>

          <Text style={styles.profileEmailText}>
            {profile?.email || "No email"}
          </Text>
        </View>
      </View>

      <Card>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.text.muted}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Your phone number"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={address}
          onChangeText={setAddress}
          placeholder="Your address"
          placeholderTextColor={colors.text.muted}
          multiline={true}
          numberOfLines={3}
        />

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <Button
          title="Save Changes"
          icon="save-outline"
          onPress={updateProfile}
          loading={loading}
          style={styles.saveButton}
        />
      </Card>

      {/* Account Info */}
      <SectionTitle>Account Information</SectionTitle>
      <Card>
        <InfoRow
          icon="mail-outline"
          label="Email"
          value={profile?.email || "N/A"}
        />
        <InfoRow
          icon="call-outline"
          label="Phone"
          value={profile?.phone || "Not provided"}
        />
        <InfoRow
          icon="location-outline"
          label="Address"
          value={profile?.address || "Not provided"}
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
          label="Verified"
          value={profile?.isVerified ? "Yes" : "No"}
        />
      </Card>
    </ScrollView>
  );
}

// ============== STYLES ==============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // App Header (Branded)
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
  appLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  appLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
    backgroundColor: colors.brand.cyan,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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

  // Card styles
  cardTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Location inputs
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  locationHeaderText: {
    flex: 1,
  },
  locationInputs: {
    flexDirection: "row",
    gap: spacing.md,
  },
  coordInput: {
    flex: 1,
  },

  // GPS Button
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${colors.brand.primary}15`,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}30`,
    marginBottom: spacing.md,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },

  // Inputs
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

  // Filters
  filterLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterTabActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterTabText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: colors.text.inverse,
  },

  // Search button
  searchButton: {
    marginTop: spacing.md,
  },

  // Loader
  loader: {
    marginVertical: spacing.xl,
  },

  // Provider Cards
  providerCard: {
    marginBottom: spacing.md,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
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
    marginLeft: 4,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(53, 208, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  typeEmoji: {
    fontSize: 14,
  },
  typeText: {
    color: colors.brand.primary,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  providerDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },

  // Services
  servicesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
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
  moreServices: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    alignSelf: "center",
  },

  // Fuel prices
  fuelPricesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  fuelPriceTag: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  fuelPriceUnavailable: {
    opacity: 0.5,
  },
  fuelPriceType: {
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  fuelPriceValue: {
    color: colors.brand.cyan,
    fontSize: fontSize.md,
    fontWeight: "700",
    marginTop: 2,
  },
  fuelPriceNA: {
    color: colors.error,
    fontSize: fontSize.xs,
  },

  // Charging types
  chargingTypesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chargingTypeTag: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    alignItems: "center",
    minWidth: 80,
  },
  chargingTypeUnavailable: {
    opacity: 0.5,
  },
  chargingTypeVehicle: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },
  chargingTypeConnector: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  chargingTypePrice: {
    color: colors.brand.emerald,
    fontSize: fontSize.sm,
    fontWeight: "700",
    marginTop: 2,
  },

  // Request button
  requestButton: {
    marginTop: spacing.lg,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: "90%",
    minHeight: 0,
    overflow: "hidden",
  },
  modalScrollContent: {
    paddingBottom: spacing.md,
  },
  orderModalScrollContent: {
    paddingBottom: spacing.xxl,
  },
  modalScrollBody: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
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
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  selectedProviderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  selectedProviderText: {
    flex: 1,
  },
  selectedProviderName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  orderModalButtons: {
    marginBottom: spacing.md,
  },
  modalButton: {
    flex: 1,
  },

  // Picker
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

  // Price summary
  priceSummary: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  priceLabel: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  priceValue: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  totalValue: {
    color: colors.brand.cyan,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },

  // Battery visual
  batteryInputs: {
    flexDirection: "row",
    gap: spacing.md,
  },
  batteryInput: {
    flex: 1,
  },
  batteryVisual: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  batteryIcon: {
    width: 60,
    height: 28,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "center",
  },
  batteryFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Requests list
  requestList: {
    paddingBottom: 40,
  },
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
  requestType: {
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  contactText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  trackButton: {
    marginTop: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },

  // Feedback styles
  pendingFeedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: `${colors.brand.primary}15`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}30`,
  },
  pendingFeedbackText: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
    flex: 1,
  },
  feedbackPendingCard: {
    borderColor: colors.brand.primary,
    borderWidth: 1,
  },
  feedbackCard: {},
  feedbackCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  feedbackCardInfo: {
    flex: 1,
  },
  feedbackProviderName: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  feedbackServiceType: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
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
  feedbackResponse: {
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  feedbackResponseLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  feedbackResponseText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  leaveFeedbackBtn: {
    marginTop: spacing.md,
  },
  ratingLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  ratingSelector: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  ratingValue: {
    color: colors.brand.primary,
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.sm,
  },

  // Profile Hero Card styles
  profileHeroCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
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
  profileHeroAvatar: {
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
  profileHeroRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  profileHeroRoleText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  profileEmailText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  // GPS Hint
  gpsHint: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  // Service Details for Cards
  serviceDetailsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  serviceDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceDetailText: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },

  // Picker Item Style (for dark mode dropdown visibility)
  pickerItem: {
    backgroundColor: colors.bg.input,
    color: colors.text.primary,
  },

  // Image Picker
  imagePickerRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  imagePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.bg.tertiary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  imagePickerText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  imagePreviewWrap: {
    marginTop: spacing.md,
    position: "relative",
    alignSelf: "flex-start",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Payment Method Selection
  paymentMethodsWrap: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  paymentMethodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.bg.tertiary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  paymentMethodBtnActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  paymentMethodText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  paymentMethodTextActive: {
    color: colors.text.inverse,
  },
});

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, borderRadius, fontSize } from "../components/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROLES = [
  {
    label: "User",
    value: "user",
    description: "Need roadside help",
    icon: "person",
    emoji: "🚗",
    color: "#3b82f6",
  },
  {
    label: "Mechanic",
    value: "mechanic",
    description: "Offer repair services",
    icon: "construct",
    emoji: "🔧",
    color: "#f59e0b",
  },
  {
    label: "Fuel Station",
    value: "fuelStation",
    description: "Deliver fuel nearby",
    icon: "flame",
    emoji: "⛽",
    color: "#ef4444",
  },
  {
    label: "EV Charging",
    value: "chargingStation",
    description: "Mobile EV charging",
    icon: "flash",
    emoji: "⚡",
    color: "#10b981",
  },
  {
    label: "Admin",
    value: "admin",
    description: "Platform management",
    icon: "shield-checkmark",
    emoji: "🛡️",
    color: "#8b5cf6",
  },
];

export default function AuthScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    role: "user",
    name: "",
    stationName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
    mechanicType: "car",
    servicesOffered: "",
    experience: "",
    licenseNumber: "",
    openingHours: "",
    deliveryAvailable: true,
    deliveryRadius: "",
    deliveryCharges: "",
    minimumOrderQuantity: "",
    fuelType: "Petrol",
    fuelPrice: "",
    mobileChargingAvailable: true,
    serviceRadius: "",
    serviceCharges: "",
    estimatedResponseTime: "",
    vehicleType: "4-wheeler",
    connectorType: "CCS2",
    pricePerKwh: "",
  });

  const rolesForCurrentMode = useMemo(() => {
    return isRegisterMode
      ? ROLES.filter((role) => role.value !== "admin")
      : ROLES;
  }, [isRegisterMode]);

  const selectedRole = ROLES.find((r) => r.value === form.role);

  useEffect(() => {
    if (route.params?.mode === "signup") {
      setIsRegisterMode(true);
    }
    if (route.params?.mode === "login") {
      setIsRegisterMode(false);
    }
  }, [route.params?.mode]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setMessage("");
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isRegisterMode) {
        const payload = {
          role: form.role,
          name: form.name,
          stationName: form.stationName,
          ownerName: form.ownerName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
        };

        if (form.role === "mechanic") {
          payload.mechanicType = form.mechanicType;
          payload.servicesOffered = form.servicesOffered
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          payload.experience = Number(form.experience) || 0;
          payload.licenseNumber = form.licenseNumber;
          payload.licenseCopy = "pending-upload";
          payload.location = {
            type: "Point",
            coordinates: [
              Number(form.longitude) || 77.5946,
              Number(form.latitude) || 12.9716,
            ],
          };
        }

        if (form.role === "fuelStation") {
          payload.stationName = form.stationName;
          payload.ownerName = form.ownerName || form.name;
          payload.fuelTypes = [
            {
              type: form.fuelType,
              price: Number(form.fuelPrice) || 0,
              available: true,
            },
          ];
          payload.openingHours = form.openingHours || "24 Hours";
          payload.deliveryAvailable = form.deliveryAvailable;
          payload.deliveryRadius = Number(form.deliveryRadius) || 5;
          payload.deliveryCharges = Number(form.deliveryCharges) || 50;
          payload.minimumOrderQuantity = Number(form.minimumOrderQuantity) || 5;
          payload.licenseNumber = form.licenseNumber;
          payload.licenseCopy = "pending-upload";
          payload.location = {
            type: "Point",
            coordinates: [
              Number(form.longitude) || 77.5946,
              Number(form.latitude) || 12.9716,
            ],
          };
        }

        if (form.role === "chargingStation") {
          payload.stationName = form.stationName;
          payload.ownerName = form.ownerName || form.name;
          payload.chargingTypes = [
            {
              vehicleType: form.vehicleType,
              connectorType: form.connectorType,
              pricePerKwh: Number(form.pricePerKwh) || 0,
              available: true,
            },
          ];
          payload.mobileChargingAvailable = form.mobileChargingAvailable;
          payload.serviceRadius = Number(form.serviceRadius) || 10;
          payload.serviceCharges = Number(form.serviceCharges) || 100;
          payload.estimatedResponseTime =
            Number(form.estimatedResponseTime) || 30;
          payload.licenseNumber = form.licenseNumber;
          payload.licenseCopy = "pending-upload";
          payload.location = {
            type: "Point",
            coordinates: [
              Number(form.longitude) || 77.5946,
              Number(form.latitude) || 12.9716,
            ],
          };
        }

        await register(payload);
        if (
          ["mechanic", "fuelStation", "chargingStation"].includes(form.role)
        ) {
          setMessage(
            "Registration submitted. Your account is pending admin approval.",
          );
        } else {
          setMessage("Registration successful. Please login.");
        }
        setIsRegisterMode(false);
      } else {
        await login({
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top : spacing.md },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerLogo}>
            <Ionicons name="car" size={16} color="#1e3a5f" />
          </View>
          <Text style={styles.headerTitle}>On Road Assistance</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.modeIndicator}>
            <Ionicons
              name={isRegisterMode ? "rocket-outline" : "car-sport"}
              size={32}
              color={colors.brand.primary}
            />
          </View>
          <Text style={styles.heroTitle}>
            {isRegisterMode ? "Create Account" : "Welcome Back!"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isRegisterMode
              ? "Join our roadside assistance network"
              : "Sign in to continue to On Road Assistance"}
          </Text>
        </View>

        {/* Messages */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {message ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        {/* Role Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="people-outline"
              size={20}
              color={colors.brand.primary}
            />
            <Text style={styles.sectionTitle}>Select Your Role</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roleRow}
          >
            {rolesForCurrentMode.map((role) => {
              const selected = form.role === role.value;
              return (
                <Pressable
                  key={role.value}
                  style={({ pressed }) => [
                    styles.roleCard,
                    selected && styles.roleCardActive,
                    selected && { borderColor: role.color },
                    pressed && styles.roleCardPressed,
                  ]}
                  onPress={() => setField("role", role.value)}
                >
                  <View
                    style={[
                      styles.roleIconWrap,
                      {
                        backgroundColor: selected
                          ? role.color
                          : `${role.color}20`,
                      },
                    ]}
                  >
                    <Text style={styles.roleEmoji}>{role.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.roleTitle,
                      selected && styles.roleTitleActive,
                    ]}
                  >
                    {role.label}
                  </Text>
                  <Text
                    style={[
                      styles.roleDescription,
                      selected && styles.roleDescriptionActive,
                    ]}
                  >
                    {role.description}
                  </Text>
                  {selected && (
                    <View
                      style={[
                        styles.roleCheckmark,
                        { backgroundColor: role.color },
                      ]}
                    >
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Registration Fields */}
        {isRegisterMode ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.brand.primary}
              />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            {form.role === "fuelStation" || form.role === "chargingStation" ? (
              <>
                <Field
                  label="Station Name"
                  value={form.stationName}
                  onChangeText={(value) => setField("stationName", value)}
                  placeholder="Enter station name"
                  icon="business-outline"
                />
                <Field
                  label="Owner Name"
                  value={form.ownerName}
                  onChangeText={(value) => setField("ownerName", value)}
                  placeholder="Enter owner name"
                  icon="person-outline"
                />
              </>
            ) : (
              <Field
                label="Full Name"
                value={form.name}
                onChangeText={(value) => setField("name", value)}
                placeholder="Enter your full name"
                icon="person-outline"
              />
            )}

            <Field
              label="Phone Number"
              value={form.phone}
              onChangeText={(value) => setField("phone", value)}
              placeholder="9876543210"
              keyboardType="phone-pad"
              icon="call-outline"
            />
            <Field
              label="Address"
              value={form.address}
              onChangeText={(value) => setField("address", value)}
              placeholder="Street, City, State"
              icon="location-outline"
            />

            {/* Mechanic specific fields */}
            {form.role === "mechanic" ? (
              <RoleCard
                title="Mechanic Details"
                icon="construct"
                color="#f59e0b"
              >
                <PickerField
                  label="Vehicle Type"
                  value={form.mechanicType}
                  onChange={(value) => setField("mechanicType", value)}
                  options={[
                    { label: "🚗 Car", value: "car" },
                    { label: "🚛 Bus / Truck", value: "bus_truck" },
                    { label: "🏍️ Bike", value: "bike" },
                  ]}
                />
                <Field
                  label="Services Offered"
                  value={form.servicesOffered}
                  onChangeText={(value) => setField("servicesOffered", value)}
                  placeholder="Tyre, Engine, Battery, etc."
                  icon="build-outline"
                />
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="Experience (years)"
                      value={form.experience}
                      onChangeText={(value) => setField("experience", value)}
                      placeholder="5"
                      keyboardType="numeric"
                      icon="time-outline"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="License Number"
                      value={form.licenseNumber}
                      onChangeText={(value) => setField("licenseNumber", value)}
                      placeholder="LIC123"
                      icon="card-outline"
                    />
                  </View>
                </View>
                <LatLngFields form={form} setField={setField} />
              </RoleCard>
            ) : null}

            {/* Fuel Station specific fields */}
            {form.role === "fuelStation" ? (
              <RoleCard
                title="Fuel Station Details"
                icon="flame"
                color="#ef4444"
              >
                <Field
                  label="Opening Hours"
                  value={form.openingHours}
                  onChangeText={(value) => setField("openingHours", value)}
                  placeholder="24 Hours"
                  icon="time-outline"
                />
                <Field
                  label="License Number"
                  value={form.licenseNumber}
                  onChangeText={(value) => setField("licenseNumber", value)}
                  placeholder="FUEL-LIC-123"
                  icon="card-outline"
                />
                <PickerField
                  label="Primary Fuel Type"
                  value={form.fuelType}
                  onChange={(value) => setField("fuelType", value)}
                  options={[
                    { label: "🟢 Petrol", value: "Petrol" },
                    { label: "🟡 Diesel", value: "Diesel" },
                    { label: "🔵 CNG", value: "CNG" },
                  ]}
                />
                <Field
                  label="Price per Liter (₹)"
                  value={form.fuelPrice}
                  onChangeText={(value) => setField("fuelPrice", value)}
                  placeholder="100"
                  keyboardType="numeric"
                  icon="pricetag-outline"
                />
                <ToggleField
                  label="Delivery Available"
                  value={form.deliveryAvailable}
                  onChange={(value) => setField("deliveryAvailable", value)}
                />
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="Delivery Radius (km)"
                      value={form.deliveryRadius}
                      onChangeText={(value) =>
                        setField("deliveryRadius", value)
                      }
                      placeholder="5"
                      keyboardType="numeric"
                      icon="locate-outline"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="Delivery Charges (₹)"
                      value={form.deliveryCharges}
                      onChangeText={(value) =>
                        setField("deliveryCharges", value)
                      }
                      placeholder="50"
                      keyboardType="numeric"
                      icon="cash-outline"
                    />
                  </View>
                </View>
                <Field
                  label="Min Order Quantity (L)"
                  value={form.minimumOrderQuantity}
                  onChangeText={(value) =>
                    setField("minimumOrderQuantity", value)
                  }
                  placeholder="5"
                  keyboardType="numeric"
                  icon="beaker-outline"
                />
                <LatLngFields form={form} setField={setField} />
              </RoleCard>
            ) : null}

            {/* Charging Station specific fields */}
            {form.role === "chargingStation" ? (
              <RoleCard
                title="EV Charging Details"
                icon="flash"
                color="#10b981"
              >
                <PickerField
                  label="Vehicle Type"
                  value={form.vehicleType}
                  onChange={(value) => setField("vehicleType", value)}
                  options={[
                    { label: "🛵 2-Wheeler", value: "2-wheeler" },
                    { label: "🛺 3-Wheeler", value: "3-wheeler" },
                    { label: "🚗 4-Wheeler", value: "4-wheeler" },
                    { label: "🚛 Commercial", value: "commercial" },
                  ]}
                />
                <PickerField
                  label="Connector Type"
                  value={form.connectorType}
                  onChange={(value) => setField("connectorType", value)}
                  options={[
                    { label: "⚡ Type 2", value: "Type2" },
                    { label: "⚡ CCS2", value: "CCS2" },
                    { label: "⚡ CHAdeMO", value: "CHAdeMO" },
                    { label: "⚡ GB/T", value: "GBT" },
                  ]}
                />
                <Field
                  label="Price per kWh (₹)"
                  value={form.pricePerKwh}
                  onChangeText={(value) => setField("pricePerKwh", value)}
                  placeholder="15"
                  keyboardType="numeric"
                  icon="pricetag-outline"
                />
                <Field
                  label="License Number"
                  value={form.licenseNumber}
                  onChangeText={(value) => setField("licenseNumber", value)}
                  placeholder="EV-LIC-123"
                  icon="card-outline"
                />
                <ToggleField
                  label="Mobile Charging Available"
                  value={form.mobileChargingAvailable}
                  onChange={(value) =>
                    setField("mobileChargingAvailable", value)
                  }
                />
                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="Service Radius (km)"
                      value={form.serviceRadius}
                      onChangeText={(value) => setField("serviceRadius", value)}
                      placeholder="10"
                      keyboardType="numeric"
                      icon="locate-outline"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Field
                      label="Service Charges (₹)"
                      value={form.serviceCharges}
                      onChangeText={(value) =>
                        setField("serviceCharges", value)
                      }
                      placeholder="100"
                      keyboardType="numeric"
                      icon="cash-outline"
                    />
                  </View>
                </View>
                <Field
                  label="Est. Response Time (min)"
                  value={form.estimatedResponseTime}
                  onChangeText={(value) =>
                    setField("estimatedResponseTime", value)
                  }
                  placeholder="30"
                  keyboardType="numeric"
                  icon="time-outline"
                />
                <LatLngFields form={form} setField={setField} />
              </RoleCard>
            ) : null}
          </View>
        ) : null}

        {/* Credentials Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.brand.primary}
            />
            <Text style={styles.sectionTitle}>
              {isRegisterMode ? "Create Credentials" : "Enter Credentials"}
            </Text>
          </View>

          <Field
            label="Email Address"
            value={form.email}
            onChangeText={(value) => setField("email", value)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <View style={styles.passwordField}>
            <Field
              label="Password"
              value={form.password}
              onChangeText={(value) => setField("password", value)}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              icon="key-outline"
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.text.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            loading && styles.submitButtonDisabled,
            pressed && !loading && styles.submitButtonPressed,
          ]}
          onPress={loading ? null : submit}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Ionicons
                name={isRegisterMode ? "rocket-outline" : "log-in-outline"}
                size={22}
                color={colors.text.inverse}
              />
              <Text style={styles.submitButtonText}>
                {isRegisterMode ? "Create Account" : "Sign In"}
              </Text>
            </>
          )}
        </Pressable>

        {/* Switch Mode Link */}
        <View style={styles.switchModeWrap}>
          <Text style={styles.switchModeText}>
            {isRegisterMode
              ? "Already have an account?"
              : "Don't have an account?"}
          </Text>
          <Pressable
            onPress={() => {
              setIsRegisterMode((prev) => !prev);
              setError("");
              setMessage("");
            }}
          >
            <Text style={styles.switchModeLink}>
              {isRegisterMode ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  secureTextEntry,
  multiline,
  editable,
  icon,
  ...props
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={colors.text.muted}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={secureTextEntry === true}
          multiline={multiline === true}
          editable={editable !== false}
          {...props}
        />
      </View>
    </View>
  );
}

function PickerField({ label, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.dropdownButton,
          pressed && styles.dropdownButtonPressed,
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedOption?.label || "Select..."}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.text.muted} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>{label}</Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={styles.dropdownClose}
              >
                <Ionicons name="close" size={20} color={colors.text.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.dropdownList}>
              {options.map((item) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    key={item.value}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                      pressed && styles.dropdownItemPressed,
                    ]}
                    onPress={() => {
                      onChange(item.value);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.brand.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        trackColor={{
          false: colors.bg.tertiary,
          true: `${colors.brand.primary}80`,
        }}
        thumbColor={value ? colors.brand.primary : colors.text.muted}
      />
    </View>
  );
}

function RoleCard({ title, icon, color, children }) {
  return (
    <View style={[styles.roleDetailCard, { borderColor: `${color}40` }]}>
      <View style={styles.roleDetailHead}>
        <View
          style={[styles.roleDetailIconWrap, { backgroundColor: `${color}20` }]}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.roleDetailTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LatLngFields({ form, setField }) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldHalf}>
        <Field
          label="Latitude"
          value={form.latitude}
          onChangeText={(value) => setField("latitude", value)}
          placeholder="12.9716"
          keyboardType="numeric"
          icon="navigate-outline"
        />
      </View>
      <View style={styles.fieldHalf}>
        <Field
          label="Longitude"
          value={form.longitude}
          onChangeText={(value) => setField("longitude", value)}
          placeholder="77.5946"
          keyboardType="numeric"
          icon="navigate-outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    backgroundColor: colors.bg.tertiary,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#91d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  headerRight: {
    width: 40,
  },

  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  // Hero Section
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modeIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  heroSubtitle: {
    color: colors.text.muted,
    fontSize: fontSize.md,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  // Messages
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: "#ef4444",
    fontSize: fontSize.sm,
    flex: 1,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: {
    color: "#10b981",
    fontSize: fontSize.sm,
    flex: 1,
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },

  // Role Selection
  roleRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  roleCard: {
    width: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    alignItems: "center",
    position: "relative",
  },
  roleCardActive: {
    backgroundColor: colors.bg.card,
    borderWidth: 2,
  },
  roleCardPressed: {
    opacity: 0.8,
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleTitle: {
    color: colors.text.primary,
    fontWeight: "700",
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  roleTitleActive: {
    color: colors.text.primary,
  },
  roleDescription: {
    color: colors.text.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  roleDescriptionActive: {
    color: colors.text.secondary,
  },
  roleCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Role Detail Card
  roleDetailCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
  },
  roleDetailHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleDetailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  roleDetailTitle: {
    color: colors.text.primary,
    fontWeight: "700",
    fontSize: fontSize.md,
  },

  // Fields
  fieldBlock: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: 6,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSize.md,
  },
  inputWithIcon: {
    paddingLeft: 42,
  },
  passwordField: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: 14,
    top: 38,
  },

  // Custom Dropdown
  dropdownButton: {
    backgroundColor: colors.bg.input,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonPressed: {
    borderColor: colors.border.focus,
  },
  dropdownButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  dropdownModal: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    width: "100%",
    maxWidth: 340,
    maxHeight: 320,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.bg.tertiary,
  },
  dropdownHeaderText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  dropdownClose: {
    padding: spacing.xs,
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  dropdownItemSelected: {
    backgroundColor: `${colors.brand.primary}15`,
  },
  dropdownItemPressed: {
    backgroundColor: colors.bg.tertiary,
  },
  dropdownItemText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
  },
  dropdownItemTextSelected: {
    color: colors.brand.primary,
    fontWeight: "600",
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },

  // Submit Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.lg,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },

  // Switch Mode
  switchModeWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  switchModeText: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  switchModeLink: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  footerText: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});

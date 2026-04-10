import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, borderRadius } from "./theme";
import { Button } from "./ui";
import LiveTrackingMap from "./LiveTrackingMap";
import { useSocket } from "../context/SocketContext";
import {
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  getStatusInfo,
  getProviderLabel,
  isRequestTrackable,
} from "../services/trackingService";

export default function TrackingModal({
  visible,
  onClose,
  request,
  requestType, // 'mechanic', 'fuel', 'charging'
  isProvider = false, // true if provider viewing user location
}) {
  const { providerLocation, sendUserLocation, clearProviderLocation } =
    useSocket();
  const [userLocation, setUserLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get provider details based on request type
  const getProviderDetails = () => {
    if (!request) return null;

    switch (requestType) {
      case "mechanic":
        return {
          name:
            request.mechanic?.user?.name ||
            request.mechanic?.name ||
            "Mechanic",
          phone: request.mechanic?.user?.phone || request.mechanic?.phone,
          id: request.mechanic?._id || request.mechanic,
        };
      case "fuel":
        return {
          name:
            request.deliveryPersonName ||
            request.fuelStation?.stationName ||
            "Fuel Station",
          phone: request.deliveryPersonPhone || request.fuelStation?.phone,
          id: request.fuelStation?._id || request.fuelStation,
          vehicle: request.vehicleNumber,
        };
      case "charging":
        return {
          name:
            request.technicianName ||
            request.chargingStation?.stationName ||
            "Charging Station",
          phone: request.technicianPhone || request.chargingStation?.phone,
          id: request.chargingStation?._id || request.chargingStation,
          vehicle: request.vehicleNumber,
        };
      default:
        return null;
    }
  };

  // Get user details for provider view
  const getUserDetails = () => {
    if (!request) return null;
    return {
      name: request.user?.name || "User",
      phone: request.user?.phone,
      address: request.address,
    };
  };

  const providerDetails = getProviderDetails();
  const userDetails = getUserDetails();
  const statusInfo = getStatusInfo(requestType, request?.status);

  // Initialize location tracking
  useEffect(() => {
    if (visible) {
      initializeTracking();
    }

    return () => {
      if (locationSubscription) {
        stopLocationTracking(locationSubscription);
      }
      clearProviderLocation();
    };
  }, [visible]);

  const initializeTracking = async () => {
    setLoading(true);
    setError("");

    try {
      // Get current location first
      const locationResult = await getCurrentLocation();
      if (locationResult.success) {
        setUserLocation(locationResult.coords);
      } else {
        setError(locationResult.error);
      }

      // If user is tracking provider, start sharing their location
      if (!isProvider && request && providerDetails?.id) {
        const trackingResult = await startLocationTracking((coords) => {
          setUserLocation(coords);
          // Share location with provider
          sendUserLocation(
            request._id,
            providerDetails.id,
            requestType,
            coords,
          );
        }, 5000);

        if (trackingResult.success) {
          setLocationSubscription(trackingResult.subscription);
        }
      }
    } catch (err) {
      setError("Failed to initialize tracking");
    } finally {
      setLoading(false);
    }
  };

  // Make phone call
  const handleCall = useCallback(() => {
    const phone = isProvider ? userDetails?.phone : providerDetails?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }, [isProvider, userDetails?.phone, providerDetails?.phone]);

  // Open in maps app
  const handleNavigate = useCallback(() => {
    const destination = isProvider ? userLocation : providerLocation;

    if (destination) {
      const scheme = Platform.select({
        ios: "maps:",
        android: "geo:",
      });
      const url = Platform.select({
        ios: `${scheme}?daddr=${destination.latitude},${destination.longitude}`,
        android: `${scheme}${destination.latitude},${destination.longitude}?q=${destination.latitude},${destination.longitude}`,
      });
      Linking.openURL(url);
    }
  }, [isProvider, userLocation, providerLocation]);

  if (!request) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {isProvider
                ? "Navigate to User"
                : `Track ${getProviderLabel(requestType)}`}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusInfo.color}20` },
              ]}
            >
              <Ionicons
                name={statusInfo.icon}
                size={14}
                color={statusInfo.color}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Map */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loadingText}>Getting location...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="location-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Retry"
              icon="refresh-outline"
              onPress={initializeTracking}
              variant="primary"
              style={styles.retryButton}
            />
          </View>
        ) : (
          <LiveTrackingMap
            userLocation={userLocation}
            providerLocation={providerLocation}
            requestType={requestType}
            style={styles.map}
          />
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          {/* Provider/User Info */}
          <View style={styles.infoRow}>
            <View style={styles.avatarCircle}>
              <Ionicons
                name={isProvider ? "person" : getProviderIcon(requestType)}
                size={24}
                color={colors.brand.primary}
              />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoName}>
                {isProvider ? userDetails?.name : providerDetails?.name}
              </Text>
              {(isProvider
                ? userDetails?.address
                : providerDetails?.vehicle) && (
                <Text style={styles.infoSubtext}>
                  {isProvider
                    ? userDetails.address
                    : `Vehicle: ${providerDetails.vehicle}`}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.actionButton}
              onPress={handleCall}
              disabled={
                !(isProvider ? userDetails?.phone : providerDetails?.phone)
              }
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                ]}
              >
                <Ionicons name="call" size={20} color="#10b981" />
              </View>
              <Text style={styles.actionLabel}>Call</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={handleNavigate}
              disabled={!(isProvider ? userLocation : providerLocation)}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                ]}
              >
                <Ionicons name="navigate" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.actionLabel}>Navigate</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={onClose}>
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                ]}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </View>
              <Text style={styles.actionLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getProviderIcon(requestType) {
  switch (requestType) {
    case "mechanic":
      return "construct";
    case "fuel":
      return "flame";
    case "charging":
      return "flash";
    default:
      return "car";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.muted,
    fontSize: fontSize.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border.default,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  infoText: {
    flex: 1,
  },
  infoName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  infoSubtext: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
    gap: spacing.xs,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, borderRadius } from "./theme";
import {
  formatDistance,
  formatETA,
  calculateDistance,
  calculateETA,
} from "../services/trackingService";

export default function LiveTrackingMap({
  userLocation,
  providerLocation,
  requestType = "mechanic",
  style,
}) {
  // Calculate distance and ETA
  const distance =
    userLocation && providerLocation
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          providerLocation.latitude,
          providerLocation.longitude,
        )
      : null;

  const eta = distance ? calculateETA(distance) : null;

  // Get provider icon based on type
  const getProviderIcon = () => {
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
  };

  // Get provider color based on type
  const getProviderColor = () => {
    switch (requestType) {
      case "mechanic":
        return "#3b82f6"; // Blue
      case "fuel":
        return "#f59e0b"; // Amber
      case "charging":
        return "#10b981"; // Green
      default:
        return colors.brand.primary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.webContent}>
        <Ionicons name="map-outline" size={48} color={colors.text.muted} />
        <Text style={styles.webTitle}>Live Tracking</Text>
        <Text style={styles.webSubtitle}>
          Map view is available on mobile app
        </Text>

        {/* Show coordinates info */}
        {userLocation && (
          <View style={styles.webLocationCard}>
            <Ionicons name="person" size={20} color={colors.brand.primary} />
            <Text style={styles.webLocationText}>
              Your Location: {userLocation.latitude.toFixed(4)},{" "}
              {userLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {providerLocation && (
          <View style={styles.webLocationCard}>
            <Ionicons
              name={getProviderIcon()}
              size={20}
              color={getProviderColor()}
            />
            <Text style={styles.webLocationText}>
              Provider: {providerLocation.latitude.toFixed(4)},{" "}
              {providerLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {/* ETA Info */}
        {distance !== null && eta !== null && (
          <View style={styles.webEtaCard}>
            <View style={styles.webEtaItem}>
              <Ionicons
                name="time-outline"
                size={24}
                color={colors.brand.primary}
              />
              <Text style={styles.webEtaValue}>{formatETA(eta)}</Text>
              <Text style={styles.webEtaLabel}>ETA</Text>
            </View>
            <View style={styles.webEtaDivider} />
            <View style={styles.webEtaItem}>
              <Ionicons
                name="navigate-outline"
                size={24}
                color={colors.brand.cyan}
              />
              <Text style={styles.webEtaValue}>{formatDistance(distance)}</Text>
              <Text style={styles.webEtaLabel}>Distance</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  webContent: {
    alignItems: "center",
    padding: spacing.xl,
  },
  webTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  webSubtitle: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  webLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  webLocationText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  webEtaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  webEtaItem: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  webEtaValue: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  webEtaLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  webEtaDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border.default,
  },
});

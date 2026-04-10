import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
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
  showRoute = true,
  style,
}) {
  const mapRef = useRef(null);

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

  // Fit map to show both markers
  useEffect(() => {
    if (mapRef.current && userLocation && providerLocation) {
      const coordinates = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        {
          latitude: providerLocation.latitude,
          longitude: providerLocation.longitude,
        },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }
  }, [
    userLocation?.latitude,
    userLocation?.longitude,
    providerLocation?.latitude,
    providerLocation?.longitude,
  ]);

  // Get initial region
  const getInitialRegion = () => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    // Default to Bangalore
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

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
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="standard"
        customMapStyle={mapStyle}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
              <View style={styles.userMarkerPulse} />
            </View>
          </Marker>
        )}

        {/* Provider Location Marker */}
        {providerLocation && (
          <Marker
            coordinate={{
              latitude: providerLocation.latitude,
              longitude: providerLocation.longitude,
            }}
            title="Provider Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.providerMarker,
                { backgroundColor: getProviderColor() },
              ]}
            >
              <Ionicons name={getProviderIcon()} size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {showRoute && userLocation && providerLocation && (
          <Polyline
            coordinates={[
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              {
                latitude: providerLocation.latitude,
                longitude: providerLocation.longitude,
              },
            ]}
            strokeColor={getProviderColor()}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* ETA Card */}
      {distance !== null && eta !== null && (
        <View style={styles.etaCard}>
          <View style={styles.etaRow}>
            <View style={styles.etaItem}>
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.brand.primary}
              />
              <Text style={styles.etaValue}>{formatETA(eta)}</Text>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Ionicons
                name="navigate-outline"
                size={18}
                color={colors.brand.cyan}
              />
              <Text style={styles.etaValue}>{formatDistance(distance)}</Text>
              <Text style={styles.etaLabel}>Distance</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Dark map style
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e87" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f9ba5" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3C7680" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255763" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0d5ce" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry.fill",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#3a4762" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarkerPulse: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(125, 219, 202, 0.3)",
  },
  providerMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  etaCard: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  etaItem: {
    alignItems: "center",
    flex: 1,
  },
  etaValue: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginTop: 4,
  },
  etaLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  etaDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.default,
  },
});

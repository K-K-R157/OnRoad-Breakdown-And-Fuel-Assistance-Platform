import * as Location from "expo-location";

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Calculate ETA based on distance (assuming average speed)
export function calculateETA(distanceKm, averageSpeedKmh = 30) {
  if (distanceKm <= 0) return 0;
  const timeHours = distanceKm / averageSpeedKmh;
  return Math.ceil(timeHours * 60); // Return minutes
}

// Format ETA for display
export function formatETA(minutes) {
  if (minutes < 1) return "Arriving now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

// Format distance for display
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Request location permissions
export async function requestLocationPermission() {
  try {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      return { granted: false, error: "Foreground location permission denied" };
    }
    return { granted: true };
  } catch (error) {
    return { granted: false, error: error.message };
  }
}

// Get current location
export async function getCurrentLocation() {
  try {
    const permission = await requestLocationPermission();
    if (!permission.granted) {
      return { success: false, error: permission.error };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      success: true,
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Start watching location with callback
export async function startLocationTracking(
  onLocationUpdate,
  intervalMs = 5000,
) {
  try {
    const permission = await requestLocationPermission();
    if (!permission.granted) {
      return { success: false, error: permission.error };
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: intervalMs,
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        onLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        });
      },
    );

    return { success: true, subscription };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Stop location tracking
export function stopLocationTracking(subscription) {
  if (subscription) {
    subscription.remove();
  }
}

// Get status display info based on request type and status
export function getStatusInfo(requestType, status) {
  const statusMap = {
    mechanic: {
      pending: {
        label: "Waiting for acceptance",
        color: "#f59e0b",
        icon: "time-outline",
      },
      accepted: {
        label: "Request accepted",
        color: "#10b981",
        icon: "checkmark-circle-outline",
      },
      "en-route": {
        label: "Mechanic on the way",
        color: "#06b6d4",
        icon: "car-outline",
      },
      arrived: {
        label: "Mechanic arrived",
        color: "#8b5cf6",
        icon: "location-outline",
      },
      "in-progress": {
        label: "Work in progress",
        color: "#3b82f6",
        icon: "construct-outline",
      },
      completed: {
        label: "Service completed",
        color: "#10b981",
        icon: "checkmark-done-outline",
      },
      cancelled: {
        label: "Cancelled",
        color: "#ef4444",
        icon: "close-circle-outline",
      },
    },
    fuel: {
      pending: {
        label: "Waiting for confirmation",
        color: "#f59e0b",
        icon: "time-outline",
      },
      confirmed: {
        label: "Order confirmed",
        color: "#10b981",
        icon: "checkmark-circle-outline",
      },
      preparing: {
        label: "Preparing delivery",
        color: "#3b82f6",
        icon: "cube-outline",
      },
      "out-for-delivery": {
        label: "Out for delivery",
        color: "#06b6d4",
        icon: "car-outline",
      },
      delivered: {
        label: "Fuel delivered",
        color: "#10b981",
        icon: "checkmark-done-outline",
      },
      cancelled: {
        label: "Cancelled",
        color: "#ef4444",
        icon: "close-circle-outline",
      },
    },
    charging: {
      pending: {
        label: "Waiting for confirmation",
        color: "#f59e0b",
        icon: "time-outline",
      },
      confirmed: {
        label: "Request confirmed",
        color: "#10b981",
        icon: "checkmark-circle-outline",
      },
      dispatched: {
        label: "Technician dispatched",
        color: "#06b6d4",
        icon: "car-outline",
      },
      arrived: {
        label: "Technician arrived",
        color: "#8b5cf6",
        icon: "location-outline",
      },
      charging: {
        label: "Charging in progress",
        color: "#3b82f6",
        icon: "flash-outline",
      },
      completed: {
        label: "Charging complete",
        color: "#10b981",
        icon: "checkmark-done-outline",
      },
      cancelled: {
        label: "Cancelled",
        color: "#ef4444",
        icon: "close-circle-outline",
      },
    },
  };

  return (
    statusMap[requestType]?.[status] || {
      label: status,
      color: "#6b7280",
      icon: "help-outline",
    }
  );
}

// Check if request is trackable (provider is on the way)
export function isRequestTrackable(requestType, status) {
  const trackableStatuses = {
    mechanic: ["accepted", "en-route"],
    fuel: ["confirmed", "preparing", "out-for-delivery"],
    charging: ["confirmed", "dispatched"],
  };

  return trackableStatuses[requestType]?.includes(status) || false;
}

// Check if provider should broadcast location
export function shouldBroadcastLocation(requestType, status) {
  const broadcastStatuses = {
    mechanic: ["en-route"],
    fuel: ["out-for-delivery"],
    charging: ["dispatched"],
  };

  return broadcastStatuses[requestType]?.includes(status) || false;
}

// Get provider role name for display
export function getProviderLabel(requestType) {
  const labels = {
    mechanic: "Mechanic",
    fuel: "Delivery Person",
    charging: "Technician",
  };
  return labels[requestType] || "Provider";
}

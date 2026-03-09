/**
 * LiveTrackingMap – Google Maps based real-time tracking.
 *
 * Shows the user's location and the mechanic's live-updating location
 * on a real Google Map, with a driving route drawn between them and
 * a continuously updating ETA.
 *
 * Props:
 *   userLocation      – { lat, lng } of the breakdown user
 *   providerLocation  – { lat, lng } of the mechanic (updates via socket)
 *   providerName      – display name for the mechanic marker
 *   status            – current request status string
 *   onEtaUpdate       – callback(seconds) when ETA recalculates
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const MAP_CONTAINER = { width: "100%", height: "100%" };

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e3a5f" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c4a6e" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bangalore

const libraries = ["places"];

export default function LiveTrackingMap({
  userLocation,
  providerLocation,
  providerName = "Mechanic",
  status,
  onEtaUpdate,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const mapRef = useRef(null);
  const [directions, setDirections] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const prevProviderRef = useRef(null);

  const center = userLocation || DEFAULT_CENTER;

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Recalculate route whenever the provider location changes
  useEffect(() => {
    if (!isLoaded || !userLocation || !providerLocation) return;
    if (!window.google) return;

    // Don't recalculate if the provider hasn't moved significantly (~50m)
    const prev = prevProviderRef.current;
    if (prev) {
      const dLat = Math.abs(prev.lat - providerLocation.lat);
      const dLng = Math.abs(prev.lng - providerLocation.lng);
      if (dLat < 0.0005 && dLng < 0.0005) return;
    }
    prevProviderRef.current = providerLocation;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: providerLocation,
        destination: userLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, routeStatus) => {
        if (routeStatus === "OK" && result) {
          setDirections(result);

          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setEta(leg.duration?.text || null);
            setDistance(leg.distance?.text || null);
            if (onEtaUpdate && leg.duration?.value) {
              onEtaUpdate(leg.duration.value);
            }
          }

          // Fit map to show both markers
          if (mapRef.current) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(userLocation);
            bounds.extend(providerLocation);
            mapRef.current.fitBounds(bounds, {
              top: 50,
              bottom: 50,
              left: 50,
              right: 50,
            });
          }
        }
      },
    );
  }, [isLoaded, userLocation, providerLocation, onEtaUpdate]);

  // ── Fallback if API key is missing or loading ──
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
        <div className="text-center p-6">
          <p className="text-amber-400 font-semibold mb-2">
            Google Maps API Key Required
          </p>
          <p className="text-slate-400 text-sm">
            Add <code className="text-amber-300">VITE_GOOGLE_MAPS_API_KEY</code>{" "}
            to your <code className="text-amber-300">frontend/.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
        <p className="text-red-400 text-sm">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER}
        center={center}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
          },
        }}
      >
        {/* User marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            label={{
              text: "You",
              color: "#fff",
              fontSize: "11px",
              fontWeight: "bold",
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#3B82F6",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            }}
          />
        )}

        {/* Provider marker */}
        {providerLocation && (
          <Marker
            position={providerLocation}
            label={{
              text: providerName.slice(0, 2),
              color: "#0f172a",
              fontSize: "11px",
              fontWeight: "bold",
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#F59E0B",
              fillOpacity: 1,
              strokeColor: "#FDE68A",
              strokeWeight: 2,
            }}
          />
        )}

        {/* Driving route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#F59E0B",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* ETA + Distance overlay */}
      {(eta || distance) && (
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-4">
          {eta && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                ETA
              </p>
              <p className="text-amber-400 font-bold text-sm">{eta}</p>
            </div>
          )}
          {distance && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Distance
              </p>
              <p className="text-white font-bold text-sm">{distance}</p>
            </div>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Tracking
        </span>
      </div>
    </div>
  );
}

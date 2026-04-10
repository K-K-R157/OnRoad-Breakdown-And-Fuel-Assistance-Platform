import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, fontSize } from "../components/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SERVICES = [
  {
    id: "mechanic",
    icon: "construct",
    emoji: "🔧",
    title: "Mechanic",
    description: "On-spot repairs & towing",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.15)",
  },
  {
    id: "fuel",
    icon: "flame",
    emoji: "⛽",
    title: "Fuel Delivery",
    description: "Petrol, Diesel & CNG",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
  {
    id: "ev",
    icon: "flash",
    emoji: "⚡",
    title: "EV Charging",
    description: "Mobile charging units",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.15)",
  },
];

const FEATURES = [
  {
    icon: "location",
    title: "Live GPS Tracking",
    description: "Track help arriving in real-time on map",
    color: "#3b82f6",
  },
  {
    icon: "time",
    title: "24/7 Available",
    description: "Round the clock emergency assistance",
    color: "#8b5cf6",
  },
  {
    icon: "shield-checkmark",
    title: "Verified Providers",
    description: "Admin-approved trusted mechanics & stations",
    color: "#10b981",
  },
  {
    icon: "card",
    title: "Easy Payments",
    description: "Multiple payment options available",
    color: "#f59e0b",
  },
];

const STATS = [
  { value: "500+", label: "Mechanics" },
  { value: "200+", label: "Fuel Stations" },
  { value: "50+", label: "EV Chargers" },
  { value: "10K+", label: "Happy Users" },
];

// Cartoon vehicle component
function CartoonVehicle({ type, style }) {
  const vehicles = {
    car: (
      <View style={[styles.vehicleContainer, style]}>
        <Text style={styles.vehicleEmoji}>🚗</Text>
      </View>
    ),
    truck: (
      <View style={[styles.vehicleContainer, style]}>
        <Text style={styles.vehicleEmoji}>🚛</Text>
      </View>
    ),
    bike: (
      <View style={[styles.vehicleContainer, style]}>
        <Text style={styles.vehicleEmoji}>🏍️</Text>
      </View>
    ),
    ev: (
      <View style={[styles.vehicleContainer, style]}>
        <Text style={styles.vehicleEmoji}>🚙</Text>
      </View>
    ),
  };
  return vehicles[type] || vehicles.car;
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header with Login */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Ionicons name="car-sport" size={20} color="#b91c1c" />
            <View style={styles.logoWrench}>
              <Ionicons name="construct" size={8} color={colors.text.inverse} />
            </View>
          </View>
          <View>
            <Text style={styles.brandName}>On Road Assistance</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
          ]}
          onPress={() => navigation.navigate("Auth", { mode: "login" })}
        >
          <Ionicons
            name="log-in-outline"
            size={18}
            color={colors.brand.primary}
          />
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Cartoon Vehicles */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            {/* Floating vehicles */}
            <View style={styles.floatingVehicles}>
              <Text style={[styles.floatingEmoji, styles.float1]}>🚗</Text>
              <Text style={[styles.floatingEmoji, styles.float2]}>🏍️</Text>
              <Text style={[styles.floatingEmoji, styles.float3]}>🚛</Text>
              <Text style={[styles.floatingEmoji, styles.float4]}>⛽</Text>
              <Text style={[styles.floatingEmoji, styles.float5]}>🔧</Text>
            </View>

            {/* Road illustration */}
            <View style={styles.roadIllustration}>
              <View style={styles.road}>
                <View style={styles.roadLine} />
                <View style={styles.roadLine} />
                <View style={styles.roadLine} />
              </View>
              <Text style={styles.mainCarEmoji}>🚙</Text>
              <View style={styles.breakdownIndicator}>
                <Text style={styles.warningEmoji}>⚠️</Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Stuck on the road?{"\n"}
            <Text style={styles.heroTitleHighlight}>
              We've got you covered!
            </Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Instant roadside assistance for breakdowns, fuel delivery, and EV
            charging - anytime, anywhere.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [
                styles.ctaPrimary,
                pressed && styles.ctaPrimaryPressed,
              ]}
              onPress={() => navigation.navigate("Auth", { mode: "signup" })}
            >
              <Ionicons
                name="rocket-outline"
                size={20}
                color={colors.text.inverse}
              />
              <Text style={styles.ctaPrimaryText}>Get Started</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <Text style={styles.sectionSubtitle}>
            Complete roadside assistance at your fingertips
          </Text>

          <View style={styles.servicesGrid}>
            {SERVICES.map((service) => (
              <Pressable
                key={service.id}
                style={({ pressed }) => [
                  styles.serviceCard,
                  pressed && styles.serviceCardPressed,
                ]}
              >
                <View
                  style={[
                    styles.serviceIconWrap,
                    { backgroundColor: service.bgColor },
                  ]}
                >
                  <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc}>{service.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* How it Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>Get help in 3 simple steps</Text>

          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Request Help</Text>
                <Text style={styles.stepDesc}>
                  Open the app and select the service you need
                </Text>
              </View>
              <Text style={styles.stepEmoji}>📱</Text>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Matched</Text>
                <Text style={styles.stepDesc}>
                  We find the nearest available provider
                </Text>
              </View>
              <Text style={styles.stepEmoji}>🎯</Text>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Help Arrives</Text>
                <Text style={styles.stepDesc}>
                  Track your helper in real-time on map
                </Text>
              </View>
              <Text style={styles.stepEmoji}>🚀</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          <Text style={styles.sectionSubtitle}>
            Features that make us stand out
          </Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIconWrap,
                    { backgroundColor: `${feature.color}20` },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={22}
                    color={feature.color}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <View style={styles.bottomCtaContent}>
            <Text style={styles.bottomCtaEmoji}>🚗💨</Text>
            <Text style={styles.bottomCtaTitle}>Ready to get started?</Text>
            <Text style={styles.bottomCtaSubtitle}>
              Join thousands of happy users who trust us for roadside assistance
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.bottomCtaButton,
                pressed && styles.bottomCtaButtonPressed,
              ]}
              onPress={() => navigation.navigate("Auth", { mode: "signup" })}
            >
              <Text style={styles.bottomCtaButtonText}>
                Create Free Account
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.text.inverse}
              />
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 On Road Assistance</Text>
          <Text style={styles.footerTagline}>
            Help is always on the way! 🛣️
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  logoWrench: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand.amber,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg.primary,
  },
  brandName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  brandTagline: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}15`,
  },
  loginButtonPressed: {
    backgroundColor: `${colors.brand.primary}30`,
  },
  loginButtonText: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },

  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  heroBackground: {
    position: "relative",
    height: 160,
    marginBottom: spacing.lg,
  },
  floatingVehicles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingEmoji: {
    position: "absolute",
    fontSize: 28,
  },
  float1: { top: 10, left: 20 },
  float2: { top: 30, right: 30 },
  float3: { top: 80, left: 60 },
  float4: { top: 20, right: 80 },
  float5: { top: 100, right: 40 },
  roadIllustration: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  road: {
    width: "100%",
    height: 40,
    backgroundColor: "#374151",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  roadLine: {
    width: 30,
    height: 4,
    backgroundColor: "#fbbf24",
    borderRadius: 2,
  },
  mainCarEmoji: {
    position: "absolute",
    bottom: 25,
    fontSize: 50,
  },
  breakdownIndicator: {
    position: "absolute",
    bottom: 70,
    right: SCREEN_WIDTH * 0.25,
  },
  warningEmoji: {
    fontSize: 24,
  },
  vehicleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    textAlign: "center",
  },
  heroTitleHighlight: {
    color: colors.brand.primary,
  },
  heroSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  ctaRow: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaPrimaryText: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  ctaSecondary: {
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.bg.secondary,
  },
  ctaSecondaryPressed: {
    backgroundColor: colors.bg.tertiary,
  },
  ctaSecondaryText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },

  // Stats Section
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: colors.brand.primary,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // Section styles
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionSubtitle: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
  },
  serviceCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
  },
  serviceCardPressed: {
    backgroundColor: colors.bg.tertiary,
    transform: [{ scale: 0.98 }],
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  serviceEmoji: {
    fontSize: 28,
  },
  serviceTitle: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "700",
    marginBottom: 4,
  },
  serviceDesc: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    textAlign: "center",
  },

  // Steps Section
  stepsContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  stepDesc: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: colors.border.default,
    marginLeft: 15,
    marginVertical: spacing.xs,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  featureCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  featureTitle: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDesc: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },

  // Bottom CTA
  bottomCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    backgroundColor: colors.brand.primary,
  },
  bottomCtaContent: {
    padding: spacing.xl,
    alignItems: "center",
  },
  bottomCtaEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  bottomCtaTitle: {
    color: colors.text.inverse,
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
  },
  bottomCtaSubtitle: {
    color: "rgba(0,0,0,0.6)",
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  bottomCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bottomCtaButtonPressed: {
    opacity: 0.9,
  },
  bottomCtaButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
  },
  footerTagline: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});

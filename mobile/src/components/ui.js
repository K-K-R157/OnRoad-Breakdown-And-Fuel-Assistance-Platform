import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, fontSize } from "./theme";

// Status Badge Component
export function StatusBadge({ status }) {
  const statusStyle = colors.status[status] || colors.status.pending;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.bg,
          borderColor: statusStyle.border,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: statusStyle.text }]}>
        {status.replace(/-/g, " ").toUpperCase()}
      </Text>
    </View>
  );
}

// Card Component
export function Card({ children, style, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={[styles.card, style]}
      onPress={onPress}
      android_ripple={
        onPress ? { color: "rgba(53, 208, 255, 0.1)" } : undefined
      }
    >
      {children}
    </Wrapper>
  );
}

// Primary Button
export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  size = "md",
  style,
}) {
  const buttonStyles = {
    primary: {
      bg: colors.brand.primary,
      text: colors.text.inverse,
    },
    secondary: {
      bg: "transparent",
      text: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    outline: {
      bg: "transparent",
      text: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    success: {
      bg: colors.success,
      text: colors.text.primary,
    },
    danger: {
      bg: colors.error,
      text: colors.text.primary,
    },
    amber: {
      bg: colors.brand.amber,
      text: colors.text.inverse,
    },
    emerald: {
      bg: colors.brand.emerald,
      text: colors.text.inverse,
    },
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: fontSize.sm },
    small: { paddingVertical: 8, paddingHorizontal: 12, fontSize: fontSize.sm },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: fontSize.md },
    lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: fontSize.lg },
  };

  const { bg, text, borderColor } =
    buttonStyles[variant] || buttonStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: isDisabled ? colors.bg.tertiary : bg,
          borderColor: borderColor || "transparent",
          borderWidth: borderColor ? 1 : 0,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={isDisabled ? null : onPress}
    >
      {icon && !loading && (
        <Ionicons
          name={icon}
          size={18}
          color={text}
          style={{ marginRight: 6 }}
        />
      )}
      {loading && (
        <Ionicons
          name="reload-outline"
          size={18}
          color={text}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={[
          styles.buttonText,
          { color: text, fontSize: sizeStyle.fontSize },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// Input Field
export function Input({
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType,
  multiline = false,
  numberOfLines,
  style,
  editable = true,
}) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={colors.text.muted}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={[
          styles.input,
          icon && { paddingLeft: 40 },
          multiline && {
            height: numberOfLines ? numberOfLines * 24 : 80,
            textAlignVertical: "top",
          },
          !editable && { opacity: 0.6 },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={Boolean(secureTextEntry)}
        keyboardType={keyboardType}
        multiline={Boolean(multiline)}
        numberOfLines={numberOfLines}
        editable={Boolean(editable)}
      />
    </View>
  );
}

// Section Title
export function SectionTitle({ children, style }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

// Empty State
export function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons
          name={icon || "folder-open-outline"}
          size={40}
          color={colors.text.muted}
        />
      </View>
      <Text style={styles.emptyTitle}>{title || "No data"}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
    </View>
  );
}

// Loading Indicator
export function LoadingView({ message }) {
  return (
    <View style={styles.loadingView}>
      <Ionicons name="reload-outline" size={32} color={colors.brand.primary} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
}

// Error Message
export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

// Success Message
export function SuccessMessage({ message }) {
  if (!message) return null;
  return (
    <View style={styles.successContainer}>
      <Ionicons
        name="checkmark-circle-outline"
        size={18}
        color={colors.success}
      />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

// Rating Stars
export function RatingStars({ rating, size = 16, interactive, onRate }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.ratingStars}>
      {stars.map((star) => (
        <Pressable key={star} onPress={interactive ? () => onRate(star) : null}>
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? colors.brand.amber : colors.text.muted}
            style={{ marginRight: 2 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

// Filter Chip
export function FilterChip({ label, selected, onPress, icon }) {
  return (
    <Pressable
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={onPress}
    >
      {icon && <Text style={{ marginRight: 4 }}>{icon}</Text>}
      <Text
        style={[
          styles.filterChipText,
          selected && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Avatar/Icon Circle
export function IconCircle({ icon, color, size = 40 }) {
  return (
    <View
      style={[
        styles.iconCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ? `${color}20` : colors.bg.tertiary,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={size * 0.5}
        color={color || colors.brand.primary}
      />
    </View>
  );
}

// Divider
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

// Info Row (label: value)
export function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.infoRow}>
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={colors.text.muted}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  // Button
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  buttonText: {
    fontWeight: "700",
  },

  // Input
  inputWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 14,
    zIndex: 1,
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

  // Section Title
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text.secondary,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyMessage: {
    color: colors.text.muted,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  // Loading
  loadingView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  retryText: {
    color: colors.brand.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },

  // Success
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.success,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },

  // Rating Stars
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Filter Chip
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterChipText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: colors.text.inverse,
  },

  // Icon Circle
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    flex: 1,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});

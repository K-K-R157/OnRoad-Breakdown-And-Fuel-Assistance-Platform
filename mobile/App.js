import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import AuthScreen from "./src/screens/AuthScreen";
import UserHomeScreen from "./src/screens/UserHomeScreen";
import RoleHomeScreen from "./src/screens/RoleHomeScreen";
import HomeScreen from "./src/screens/HomeScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#35d0ff" />
      </View>
    );
  }

  if (!session) {
    return (
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    );
  }

  const role = session?.user?.role;
  const isUserRole = role === "user";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isUserRole ? (
        <Stack.Screen name="UserHome" component={UserHomeScreen} />
      ) : (
        <Stack.Screen name="RoleHome" component={RoleHomeScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer>
            <StatusBar style="light" translucent={false} />
            <RootNavigator />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1014",
  },
});

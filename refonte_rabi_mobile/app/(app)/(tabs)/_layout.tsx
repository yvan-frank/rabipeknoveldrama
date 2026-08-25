import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../../src/theme/useTheme';

// Le garde d'authentification vit un niveau au-dessus (app/(app)/_layout.tsx,
// un Stack) : ce layout ne gère que la barre d'onglets elle-même.
export default function TabsLayout() {
  const { colors, fontFamily } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.sansSemiBold, fontSize: 9 },
        // Les changements d'onglet étaient instantanés (aucune transition par
        // défaut sur bottom-tabs) — "shift" glisse+fondu légèrement la scène
        // sortante/entrante plutôt qu'une simple coupure.
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="librairie"
        options={{
          title: 'Librairie',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="drama"
        options={{
          title: 'RabipekDrama',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'film' : 'film-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreferenceStore } from '../../src/theme/theme-preference-store';
import { useTheme } from '../../src/theme/useTheme';

function LegalRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.legalRow, { borderColor: colors.border, paddingHorizontal: spacing.md }]}>
      <Text style={[typography.body, { color: colors.ink, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors, spacing, radius, typography, scheme, shadow } = useTheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const setPreference = useThemePreferenceStore((state) => state.setPreference);
  const isDark = scheme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: 8 }]}>AFFICHAGE</Text>

        <View style={[shadow, styles.row, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={20} color={colors.ink} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.body, { color: colors.ink }]}>Mode sombre</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              {preference === 'system' ? "Suit le réglage de l'appareil" : isDark ? 'Activé' : 'Désactivé'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => setPreference(value ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {preference !== 'system' ? (
          <Pressable onPress={() => setPreference('system')} style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}>
            <Text style={[typography.captionSemiBold, { color: colors.accent }]}>Revenir au réglage du système</Text>
          </Pressable>
        ) : null}

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: 8 }]}>LÉGAL</Text>
        <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <LegalRow label="Mentions légales" onPress={() => router.push('/mentions-legales')} />
          <LegalRow label="Conditions générales de vente" onPress={() => router.push('/cgv')} />
          <LegalRow label="Politique de confidentialité" onPress={() => router.push('/politique-confidentialite')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  legalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});

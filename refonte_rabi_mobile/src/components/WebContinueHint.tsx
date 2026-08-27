import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';
import { showAlert } from './AppAlert';
import { useTheme } from '../theme/useTheme';

interface Props {
  url: string;
  label?: string;
}

// L'espace auteur mobile reste volontairement minimal (pas de wizard
// complet, éditeur riche plus limité que Tiptap côté web) — ce rappel
// oriente vers le site web pour qui veut la version la plus aboutie, sans
// bloquer qui préfère continuer directement sur mobile.
export function WebContinueHint({ url, label = 'Continuer sur le site web' }: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  function handlePress() {
    Linking.openURL(url).catch(() => {
      showAlert('Oups', "Impossible d'ouvrir le site web pour l'instant.");
    });
  }

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accentMuted,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <Ionicons name="desktop-outline" size={20} color={colors.accent} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[typography.captionSemiBold, { color: colors.ink }]}>Pour une meilleure expérience</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colors.accent} />
    </Pressable>
  );
}

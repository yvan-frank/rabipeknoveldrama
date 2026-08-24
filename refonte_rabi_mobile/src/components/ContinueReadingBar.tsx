import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { overallProgress, type LibraryEntry } from '../api/library';
import { resolveAssetUrl } from '../lib/resolve-asset-url';
import { palette } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

// Fond de barre volontairement toujours sombre (cf. LinearGradient ci-dessous),
// indépendant du thème clair/sombre courant de l'app — l'accent doit donc
// rester celui du thème sombre (palette.dark.accent) pour garder un contraste
// correct, plutôt qu'une teinte figée qui dérive du reste de la palette.
const BAR_ACCENT = palette.dark.accent;

interface ContinueReadingBarProps {
  entry: LibraryEntry;
  visibility: Animated.Value;
}

const BAR_HEIGHT = 56;

// Barre fine et flottante, fixée en bas de l'écran : apparaît quand on
// scrolle vers le bas, disparaît quand on remonte (cf. index.tsx, qui pilote
// `visibility` via le sens du scroll) — un rappel discret, pas une carte
// permanente dans le flux de la liste.
export function ContinueReadingBar({ entry, visibility }: ContinueReadingBarProps) {
  const { spacing, radius, typography, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const percent = overallProgress(entry);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        shadow,
        {
          bottom: insets.bottom + spacing.md,
          left: spacing.lg,
          right: spacing.lg,
          opacity: visibility,
          transform: [{ translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [BAR_HEIGHT + 24, 0] }) }],
        },
      ]}
    >
      <Pressable onPress={() => router.push(`/book/${entry.book.slug}`)}>
        <LinearGradient colors={['#0c0c0c', '#eb1983']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bar, { borderRadius: radius.pill }]}>
          <View style={[styles.cover, { borderRadius: radius.sm }]}>
            {entry.book.cover ? (
              <Image source={{ uri: resolveAssetUrl(entry.book.cover) }} style={styles.coverImage} resizeMode="cover" />
            ) : null}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.captionSemiBold, { color: '#FFFFFF' }]} numberOfLines={1}>
              {entry.book.title}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: BAR_ACCENT }]} />
            </View>
          </View>
          <View style={[styles.playIcon, { backgroundColor: BAR_ACCENT }]}>
            <Ionicons name="play" size={15} color="#10161F" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', zIndex: 15 },
  bar: { flexDirection: 'row', alignItems: 'center', height: BAR_HEIGHT, paddingHorizontal: 8, paddingRight: 14 },
  cover: { width: 40, height: 40, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)' },
  coverImage: { width: '100%', height: '100%' },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  playIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

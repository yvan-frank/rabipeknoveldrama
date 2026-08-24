import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import type { MockDramaEpisode } from '../lib/mock-drama';

interface DramaCardProps {
  episode: MockDramaEpisode;
}

// Vignette factice (dégradé + icône), miroir de DramaCard.tsx côté web :
// aucune vraie vidéo derrière, donc pas de onPress — une vitrine "bientôt
// disponible", pas encore une fonctionnalité cliquable.
export function DramaCard({ episode }: DramaCardProps) {
  const { typography, radius, shadow } = useTheme();

  return (
    <View style={[shadow, { flex: 1, borderRadius: radius.lg, overflow: 'hidden', aspectRatio: 9 / 16 }]}>
      <LinearGradient colors={episode.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.genreBadge}>
        <Text style={[typography.label, { color: '#FFFFFF' }]}>{episode.genre.toUpperCase()}</Text>
      </View>

      <View style={styles.playBadge}>
        <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
      </View>

      <View style={styles.textOverlay}>
        <Text style={[typography.captionSemiBold, { color: '#FFFFFF' }]} numberOfLines={2}>
          {episode.title}
        </Text>
        <Text style={[typography.label, { color: 'rgba(255,255,255,0.75)', marginTop: 3 }]}>Par {episode.author}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
          <Ionicons name="film-outline" size={11} color="rgba(255,255,255,0.65)" />
          <Text style={[typography.label, { color: 'rgba(255,255,255,0.65)' }]}>
            {episode.episodeCount} épisodes · {episode.duration}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  genreBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  playBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: { position: 'absolute', left: 12, right: 12, bottom: 12 },
});

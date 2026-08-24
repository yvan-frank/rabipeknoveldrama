import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { DramaCard } from '../../../src/components/DramaCard';
import { MOCK_DRAMA_EPISODES } from '../../../src/lib/mock-drama';
import { useTheme } from '../../../src/theme/useTheme';

// Miroir de refonte_rabi_frontend/src/app/rabipek-drama/page.tsx : une
// vitrine "bientôt disponible", pas encore une fonctionnalité réelle (aucune
// route backend n'existe pour "drama" — cf. mock-drama.ts). L'espace auteur
// n'existe pas sur mobile (cf. plan mobile), donc pas de CTA "Devenir auteur"
// ici, contrairement au web.
export default function DramaScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={['#100F18', '#1A1830', '#100F18']} style={StyleSheet.absoluteFill} />
          <View style={[styles.glow, { top: -60, left: -60, backgroundColor: '#EC489944' }]} />
          <View style={[styles.glow, { bottom: -80, right: -60, backgroundColor: '#F59E0B33' }]} />

          <SafeAreaView edges={['top']} style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl }}>
            <View style={styles.badge}>
              <Ionicons name="film" size={14} color="#FDE68A" />
              <Text style={[typography.label, { color: '#FDE68A' }]}>BIENTÔT DISPONIBLE</Text>
            </View>

            <Text style={[typography.hero, { color: '#FFFFFF', marginTop: spacing.lg, textAlign: 'center' }]}>
              RabipekDrama : vos histoires en vidéo
            </Text>
            <Text style={[typography.body, { color: 'rgba(255,255,255,0.7)', marginTop: spacing.md, textAlign: 'center' }]}>
              {"Vos histoires préférées prennent vie en courtes vidéos, épisode par épisode. Un format vertical, immersif, pensé pour se laisser porter entre deux pages."}
            </Text>

            <View style={{ marginTop: spacing.xl }}>
              <Button label="Découvrir le catalogue" onPress={() => router.push('/(app)/(tabs)')} />
            </View>
          </SafeAreaView>
        </View>

        <View style={{ padding: spacing.lg }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Text style={[typography.label, { color: colors.accent }]}>UN AVANT-GOÛT</Text>
            <Text style={[typography.title, { color: colors.ink, marginTop: 6, textAlign: 'center' }]}>
              Des dramas en préparation
            </Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
              {"Ces vignettes illustrent le format à venir — les vraies vidéos seront publiées par nos auteurs dès l'ouverture de RabipekDrama."}
            </Text>
          </View>

          <View style={styles.grid}>
            {MOCK_DRAMA_EPISODES.map((episode) => (
              <View key={episode.id} style={styles.gridItem}>
                <DramaCard episode={episode} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(253,230,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.25)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
});

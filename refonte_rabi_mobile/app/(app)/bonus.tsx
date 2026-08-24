import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TestIds, useRewardedAd } from 'react-native-google-mobile-ads';
import {
  MOCK_BONUS_SECTIONS,
  MOCK_BONUS_TOTAL,
  MOCK_CHECKIN_DAYS,
  MOCK_CHECKIN_STREAK_DAYS,
  type BonusTask,
  type BonusTaskSection,
} from '../../src/lib/mock-bonus-tasks';
import { useTheme } from '../../src/theme/useTheme';

function showComingSoon() {
  Alert.alert('Bientôt disponible', 'Ce système de récompenses est en cours de finalisation.');
}

function BonusBanner() {
  const { colors, spacing, typography } = useTheme();
  return (
    <LinearGradient
      colors={[colors.accentMuted, colors.loveMuted]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      // paddingBottom généreux : réserve la place dans laquelle la carte
      // Check-in vient volontairement remonter par-dessus (marginTop négatif
      // côté CheckInCard) — sans cette réserve, la carte empièterait sur la
      // ligne "Mon bonus" au lieu de se superposer proprement au dégradé.
      style={[styles.banner, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl + spacing.lg }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="star" size={20} color={colors.accent} />
        <Text style={[typography.bodySemiBold, { color: colors.ink }]}>Mon bonus</Text>
        <Text style={[typography.heading, { color: colors.ink }]}>{MOCK_BONUS_TOTAL}</Text>
      </View>
      {/* Boîte de taille fixe + overflow hidden : le glyphe emoji peut être
          rendu plus grand que son fontSize nominal (variable selon l'OS) et
          déborder visuellement sur la carte suivante sans ça. */}
      <View style={styles.giftEmojiBox}>
        <Text style={styles.giftEmoji}>🎁</Text>
      </View>
    </LinearGradient>
  );
}

function CheckInCard() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    // marginTop négatif : fait remonter la carte par-dessus le dégradé
    // (cf. paddingBottom réservé dans BonusBanner) — c'est la superposition
    // "fancy" voulue, pas un bug d'espacement.
    <View style={[shadow, styles.overlapCard, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}>
      <Text style={[typography.bodySemiBold, { color: colors.accent }]}>Check-in accumulé : {MOCK_CHECKIN_STREAK_DAYS} Jour</Text>

      <View style={[styles.checkinRow, { marginTop: spacing.lg }]}>
        {MOCK_CHECKIN_DAYS.map((day) => (
          <View key={day.label} style={styles.checkinDay}>
            <View
              style={[
                styles.checkinBadge,
                { backgroundColor: day.done ? colors.accent : colors.accentMuted, borderRadius: radius.pill },
              ]}
            >
              <Ionicons name={day.done ? 'checkmark' : 'star'} size={12} color={day.done ? '#FFFFFF' : colors.accent} />
            </View>
            <Text style={[typography.label, { color: colors.ink, marginTop: 5, fontSize: 9, lineHeight: 11 }]} numberOfLines={1} adjustsFontSizeToFit>
              +{day.points}
            </Text>
            <Text
              style={[typography.label, { color: day.done ? colors.accent : colors.textMuted, marginTop: 1, fontSize: 9, lineHeight: 11 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {day.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: spacing.sm }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${(1 / MOCK_CHECKIN_DAYS.length) * 100}%` }]} />
      </View>

      <Pressable onPress={showComingSoon} disabled style={[styles.checkinCta, { backgroundColor: colors.border, marginTop: spacing.lg }]}>
        <Text style={[typography.bodySemiBold, { color: colors.textMuted }]}>Check-in demain</Text>
      </Pressable>
    </View>
  );
}

function PlaytimeStudioCard() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <Pressable
      onPress={showComingSoon}
      style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }]}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={[typography.bodySemiBold, { color: colors.accent }]}>Playtime Studio</Text>
        <Text style={[typography.captionSemiBold, { color: colors.accent }]}>En savoir plus</Text>
      </View>

      {/* Pas d'image réelle de jeu partenaire (aucun asset, aucun partenariat
          actif) : un simple bloc teinté + icône plutôt qu'une image inventée
          ou une capture d'un jeu tiers sans autorisation. */}
      <View style={[styles.gameBanner, { backgroundColor: colors.accentMuted, borderRadius: radius.md }]}>
        <Ionicons name="game-controller" size={36} color={colors.accent} />
      </View>

      <View style={[styles.gameRow, { marginTop: spacing.sm }]}>
        <View style={[styles.gameIcon, { backgroundColor: colors.accentMuted, borderRadius: radius.sm }]}>
          <Ionicons name="dice" size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.bodySemiBold, { color: colors.ink }]} numberOfLines={1}>
            Jeu partenaire
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="star" size={13} color={colors.accent} />
            <Text style={[typography.captionSemiBold, { color: colors.accent }]}>+7010 Bonus</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function TaskRow({ task, isLast, onPress }: { task: BonusTask; isLast: boolean; onPress: () => void }) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      style={[
        styles.taskRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingBottom: spacing.md, marginBottom: spacing.md },
      ]}
    >
      <View style={[styles.starWrap, { backgroundColor: colors.accentMuted, borderRadius: radius.pill }]}>
        <Ionicons name="star" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md, marginRight: spacing.sm }}>
        <View style={styles.titleRow}>
          <Text style={[typography.bodySemiBold, { color: colors.ink }]}>{task.title}</Text>
          {task.badge ? (
            <View style={[styles.badge, { backgroundColor: task.badge.color, borderRadius: radius.sm }]}>
              <Text style={[typography.label, { color: '#FFFFFF' }]}>{task.badge.label}</Text>
            </View>
          ) : null}
          {task.extraBadge ? <Text style={typography.captionSemiBold}>{task.extraBadge}</Text> : null}
        </View>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>{task.description}</Text>
      </View>
      <Pressable onPress={onPress} style={[styles.cta, { backgroundColor: colors.accentMuted, borderRadius: radius.pill }]}>
        {task.cta === 'ad' ? (
          <View style={styles.adCta}>
            <Ionicons name="play-circle" size={16} color={colors.accent} />
            <Text style={[typography.captionSemiBold, { color: colors.accent }]}>la pub</Text>
          </View>
        ) : (
          <Text style={[typography.captionSemiBold, { color: colors.accent }]}>À compléter</Text>
        )}
      </Pressable>
    </View>
  );
}

function TaskSectionCard({ section, onWatchAd }: { section: BonusTaskSection; onWatchAd: () => void }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }]}>
      <Text style={[typography.bodySemiBold, { color: colors.accent, marginBottom: spacing.md }]}>{section.title}</Text>
      {section.tasks.map((task, index) => (
        <TaskRow
          key={task.id}
          task={task}
          isLast={index === section.tasks.length - 1}
          onPress={task.cta === 'ad' ? onWatchAd : showComingSoon}
        />
      ))}
      {section.footerLink ? (
        <Pressable onPress={showComingSoon} style={[styles.footerLink, { borderColor: colors.border, marginTop: spacing.md }]}>
          <Text style={[typography.bodySemiBold, { color: colors.accent }]}>{section.footerLink}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Reproduit la capture de référence à la demande explicite de l'utilisateur :
// UI d'abord, la logique de progression/déblocage réelle viendra après étude
// (cf. mock-bonus-tasks.ts pour le détail de ce qui est encore factice).
export default function BonusScreen() {
  const { colors, spacing } = useTheme();
  // ID de TEST (cf. app.config.ts) : affiche une vraie pub factice Google,
  // jamais de revenu réel. À remplacer par un vrai Ad Unit ID une fois un
  // compte AdMob créé pour Rabipek.
  const { isLoaded, isEarnedReward, isClosed, load, show } = useRewardedAd(TestIds.REWARDED, {
    requestNonPersonalizedAdsOnly: true,
  });
  // Évite de déclencher l'alerte de récompense plusieurs fois pour un seul
  // visionnage (isEarnedReward reste vrai tant que le hook n'a pas rechargé).
  const rewardHandledRef = useRef(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isEarnedReward && !rewardHandledRef.current) {
      rewardHandledRef.current = true;
      // Pas de vrai crédit de bonus ici : le système de points (solde +
      // journal de transactions côté backend) n'existe pas encore, cf.
      // discussion produit — seul l'affichage de la pub est réellement
      // fonctionnel pour l'instant.
      Alert.alert('Bravo !', 'Vous avez gagné une récompense (démo — pas encore créditée sur votre solde).');
    }
  }, [isEarnedReward]);

  useEffect(() => {
    if (isClosed) {
      rewardHandledRef.current = false;
      load();
    }
  }, [isClosed, load]);

  function handleWatchAd() {
    if (isLoaded) {
      show();
    } else {
      Alert.alert('Chargement…', "La publicité n'est pas encore prête, réessayez dans quelques secondes.");
      load();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <BonusBanner />
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}>
          <CheckInCard />
          <PlaytimeStudioCard />
          {MOCK_BONUS_SECTIONS.map((section) => (
            <TaskSectionCard key={section.id} section={section} onWatchAd={handleWatchAd} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  starWrap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  cta: { paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  adCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlapCard: { marginTop: -64 },
  giftEmojiBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  giftEmoji: { fontSize: 34 },
  // Largeur FIXE (pas flex:1) : un texte court peut quand même pousser sa
  // colonne flex au-delà de ce que minWidth:0 est censé permettre de
  // rétrécir (fuite de la taille intrinsèque du Text à travers le calcul de
  // flex-shrink). Une largeur fixe et volontairement étroite élimine
  // l'ambiguïté — 7 × 30px tient largement même sur les petits écrans.
  checkinRow: { flexDirection: 'row', justifyContent: 'space-between' },
  checkinDay: { alignItems: 'center', width: 30, overflow: 'hidden' },
  checkinBadge: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  checkinCta: { borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gameBanner: { height: 110, alignItems: 'center', justifyContent: 'center' },
  gameRow: { flexDirection: 'row', alignItems: 'center' },
  gameIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
  },
});

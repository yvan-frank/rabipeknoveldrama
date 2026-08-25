import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TestIds, useRewardedAd } from 'react-native-google-mobile-ads';
import { useAuthStore } from '../../src/auth/auth-store';
import { showAlert } from '../../src/components/AppAlert';
import { BonusScreenSkeleton } from '../../src/components/BonusScreenSkeleton';
import { extractApiErrorMessage } from '../../src/api/client';
import {
  creditRewardedAdPoints,
  getArticlesStatus,
  getCheckInStatus,
  getPointsBalance,
  getReadingTimeStatus,
  getRewardedAdStatus,
  markArticleRead,
  performCheckIn,
  type ArticlesStatus,
  type CheckInStatus,
  type ReadingTimeStatus,
  type RewardedAdStatus,
} from '../../src/api/points';
import { MOCK_BONUS_SECTIONS, type BonusTask, type BonusTaskSection } from '../../src/lib/mock-bonus-tasks';
import { useTheme } from '../../src/theme/useTheme';

function showComingSoon() {
  showAlert('Bientôt disponible', 'Ce système de récompenses est en cours de finalisation.');
}

function showReadingTimeInfo() {
  showAlert(
    'Comptabilisé automatiquement',
    'Le temps de lecture se cumule tout seul pendant que vous lisez un chapitre — pas besoin de faire quoi que ce soit ici.',
  );
}

const TOAST_VISIBLE_MS = 5000;

// Vrai Ad Unit ID (rewarded) une fois publié ; TestIds.REWARDED en dev — les
// règles AdMob interdisent de charger un vrai Ad Unit ID sur un build de
// développement/test (risque de trafic invalide et de suspension du compte).
const REWARDED_AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6638210178103357/5145145303';

// Toast local à cet écran (pas de lib externe) : une simple pastille qui
// s'efface seule, pour la confirmation de crédit qui ne mérite pas de
// bloquer l'utilisateur avec une Alert (contrairement aux erreurs).
function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(text);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, TOAST_VISIBLE_MS);
    },
    [opacity],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  return { message, opacity, showToast };
}

function Toast({ message, opacity }: { message: string | null; opacity: Animated.Value }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.toastContainer}>
      <Animated.View
        style={[
          shadow,
          styles.toastPill,
          {
            opacity,
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <Ionicons name="star" size={16} color={colors.accent} />
        <Text style={[typography.bodySemiBold, { color: colors.ink, marginLeft: 8 }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

function BonusBanner({ balance }: { balance: number | null }) {
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
        <Text style={[typography.heading, { color: colors.ink }]}>{balance ?? '—'}</Text>
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

// Barème par défaut affiché pendant le chargement initial (avant la première
// réponse de GET /points/checkin) — purement cosmétique, jamais utilisé pour
// calculer un crédit réel.
const FALLBACK_POINTS_SCHEDULE = [15, 20, 20, 20, 20, 20, 20];

interface CheckInDayView {
  label: string;
  points: number;
  done: boolean;
}

// La série (streakDay, 1-7) peut être "en attente d'un check-in aujourd'hui"
// ou "déjà validée aujourd'hui" : le modulo gère aussi le cas où un cycle de
// 7 jours vient de se terminer (le prochain check-in en redémarre un neuf).
function buildCheckInDays(status: CheckInStatus): CheckInDayView[] {
  const doneCount = status.checkedInToday ? status.streakDay : status.streakDay % 7;
  const activeIndex = status.checkedInToday ? status.streakDay - 1 : status.streakDay % 7;
  return status.pointsSchedule.map((points, index) => ({
    label: index === activeIndex ? 'Auj.' : `Jour ${index + 1}`,
    points,
    done: index < doneCount,
  }));
}

function CheckInCard({
  status,
  checking,
  onCheckIn,
}: {
  status: CheckInStatus | null;
  checking: boolean;
  onCheckIn: () => void;
}) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const days = status ? buildCheckInDays(status) : FALLBACK_POINTS_SCHEDULE.map((points) => ({ label: '', points, done: false }));
  const doneCount = days.filter((day) => day.done).length;
  const canCheckIn = !!status && !status.checkedInToday && !checking;

  return (
    // marginTop négatif : fait remonter la carte par-dessus le dégradé
    // (cf. paddingBottom réservé dans BonusBanner) — c'est la superposition
    // "fancy" voulue, pas un bug d'espacement.
    <View style={[shadow, styles.overlapCard, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}>
      <Text style={[typography.bodySemiBold, { color: colors.accent }]}>Check-in accumulé : {status?.streakDay ?? 0} Jour</Text>

      <View style={[styles.checkinRow, { marginTop: spacing.lg }]}>
        {days.map((day, index) => (
          <View key={index} style={styles.checkinDay}>
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
        <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${(doneCount / 7) * 100}%` }]} />
      </View>

      <Pressable
        onPress={onCheckIn}
        disabled={!canCheckIn}
        style={[styles.checkinCta, { backgroundColor: canCheckIn ? colors.accent : colors.border, marginTop: spacing.lg }]}
      >
        <Text style={[typography.bodySemiBold, { color: canCheckIn ? '#FFFFFF' : colors.textMuted }]}>
          {checking ? 'Validation…' : status?.checkedInToday ? 'Check-in demain' : 'Check-in du jour'}
        </Text>
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
        <Ionicons name="star" size={14} color={colors.accent} />
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
      {task.completed ? (
        <View style={[styles.cta, styles.adCta, { backgroundColor: colors.successMuted, borderRadius: radius.pill }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
          <Text style={[typography.captionSemiBold, { color: colors.success }]}>Complétée</Text>
        </View>
      ) : (
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
      )}
    </View>
  );
}

// Seules les tâches "video" (pub récompensée, cf. GET/POST
// /points/earn/rewarded-ad), "articles" (cf. GET /points/articles) et
// "read-15"/"read-30" (cf. GET /points/reading-time) ont un suivi réel ; les
// autres titres restent ceux de la capture de référence, toujours factices.
function withLiveTaskData(
  sections: BonusTaskSection[],
  videoStatus: RewardedAdStatus | null,
  articlesStatus: ArticlesStatus | null,
  readingTimeStatus: ReadingTimeStatus | null,
): BonusTaskSection[] {
  const articlesReadCount = articlesStatus ? articlesStatus.articles.filter((article) => article.read).length : null;
  const minutesReadToday = readingTimeStatus ? Math.floor(readingTimeStatus.secondsToday / 60) : null;
  const milestone15 = readingTimeStatus?.milestones.find((m) => m.minutes === 15);
  const milestone30 = readingTimeStatus?.milestones.find((m) => m.minutes === 30);

  return sections.map((section) => ({
    ...section,
    tasks: section.tasks.map((task) => {
      if (task.id === 'video' && videoStatus) {
        return {
          ...task,
          title: `1 Bonus (${videoStatus.watchedToday}/${videoStatus.dailyCap})`,
          completed: videoStatus.watchedToday >= videoStatus.dailyCap,
        };
      }
      if (task.id === 'articles' && articlesReadCount !== null) {
        return { ...task, title: `1 Bonus (${articlesReadCount}/3)`, completed: articlesReadCount === 3 };
      }
      if (task.id === 'read-15' && minutesReadToday !== null && milestone15) {
        return {
          ...task,
          description: `Lire pendant 15 minute ${Math.min(minutesReadToday, 15)} / 15`,
          completed: milestone15.earned,
        };
      }
      if (task.id === 'read-30' && minutesReadToday !== null && milestone30) {
        return {
          ...task,
          description: `Lire pendant 30 minute ${Math.min(minutesReadToday, 30)} / 30`,
          completed: milestone30.earned,
        };
      }
      return task;
    }),
  }));
}

function TaskSectionCard({
  section,
  onWatchAd,
  onReadArticle,
}: {
  section: BonusTaskSection;
  onWatchAd: () => void;
  onReadArticle: () => void;
}) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }]}>
      <Text style={[typography.bodySemiBold, { color: colors.accent, marginBottom: spacing.md }]}>{section.title}</Text>
      {section.tasks.map((task, index) => (
        <TaskRow
          key={task.id}
          task={task}
          isLast={index === section.tasks.length - 1}
          onPress={
            task.cta === 'ad'
              ? onWatchAd
              : task.id === 'articles'
                ? onReadArticle
                : task.id === 'read-15' || task.id === 'read-30'
                  ? showReadingTimeInfo
                  : showComingSoon
          }
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

// Reproduit la capture de référence à la demande explicite de l'utilisateur.
// Solde, crédit de pub récompensée et check-in quotidien sont réels (cf.
// src/api/points.ts) ; Playtime Studio et les autres tâches restent factices
// pour l'instant (cf. mock-bonus-tasks.ts).
export default function BonusScreen() {
  const { colors, spacing } = useTheme();
  const authStatus = useAuthStore((state) => state.status);
  const isGuest = authStatus !== 'authenticated';
  const [balance, setBalance] = useState<number | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [videoStatus, setVideoStatus] = useState<RewardedAdStatus | null>(null);
  const [articlesStatus, setArticlesStatus] = useState<ArticlesStatus | null>(null);
  const [readingTimeStatus, setReadingTimeStatus] = useState<ReadingTimeStatus | null>(null);
  const { message: toastMessage, opacity: toastOpacity, showToast } = useToast();
  const { isLoaded, isEarnedReward, isClosed, load, show } = useRewardedAd(REWARDED_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });
  // Évite de déclencher le crédit plusieurs fois pour un seul visionnage
  // (isEarnedReward reste vrai tant que le hook n'a pas rechargé).
  const rewardHandledRef = useRef(false);

  // Vrai le temps du tout premier chargement (cf. BonusScreenSkeleton
  // ci-dessous) — pas pour un visiteur, qui n'a rien à charger (aucune
  // requête /points/* n'est déclenchée pour lui, cf. plus bas).
  const [initialLoading, setInitialLoading] = useState(!isGuest);

  const refreshBalance = useCallback(() => {
    return getPointsBalance()
      .then(({ balance: fetched }) => setBalance(fetched))
      .catch(() => {
        // Écran encore utilisable sans solde affiché (ex. hors-ligne) ;
        // pas d'alerte bloquante pour un simple défaut d'affichage.
      });
  }, []);

  const refreshCheckInStatus = useCallback(() => {
    return getCheckInStatus()
      .then(setCheckInStatus)
      .catch(() => {
        // Idem : l'écran reste utilisable, la carte affiche juste son état
        // de repli le temps que la requête finisse par passer.
      });
  }, []);

  const refreshVideoStatus = useCallback(() => {
    return getRewardedAdStatus()
      .then(setVideoStatus)
      .catch(() => {
        // Idem : compteur affiché en repli (0/20) tant que la requête n'a pas abouti.
      });
  }, []);

  const refreshArticlesStatus = useCallback(() => {
    return getArticlesStatus()
      .then(setArticlesStatus)
      .catch(() => {
        // Idem : compteur affiché en repli (0/3) tant que la requête n'a pas abouti.
      });
  }, []);

  const refreshReadingTimeStatus = useCallback(() => {
    return getReadingTimeStatus()
      .then(setReadingTimeStatus)
      .catch(() => {
        // Idem : progression affichée en repli (0/15, 0/30) tant que la requête n'a pas abouti.
      });
  }, []);

  useEffect(() => {
    // Tout /points/* exige une session (requireAuth côté serveur) : un
    // visiteur y recevrait 401 sur chaque appel, silencieusement avalé par
    // les .catch ci-dessus — inutile de les déclencher, le solde/statuts
    // resteront simplement à leur valeur de repli tant qu'il n'est pas connecté.
    if (isGuest) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    Promise.allSettled([
      refreshBalance(),
      refreshCheckInStatus(),
      refreshVideoStatus(),
      refreshArticlesStatus(),
      refreshReadingTimeStatus(),
    ]).finally(() => setInitialLoading(false));
  }, [isGuest, refreshBalance, refreshCheckInStatus, refreshVideoStatus, refreshArticlesStatus, refreshReadingTimeStatus]);

  useEffect(() => {
    load();
  }, [load]);

  // Retourne true (et invite à se connecter) si l'action doit être bloquée —
  // évite un appel API voué à échouer en 401 pour un visiteur.
  function requireAuthOrPrompt(): boolean {
    if (!isGuest) return false;
    showAlert('Connexion requise', 'Connectez-vous pour gagner et suivre vos bonus.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
    ]);
    return true;
  }

  function handleCheckIn() {
    if (requireAuthOrPrompt()) return;
    if (checkingIn || !checkInStatus || checkInStatus.checkedInToday) return;
    setCheckingIn(true);
    performCheckIn()
      .then(({ streakDay, earned, balance: newBalance }) => {
        setBalance(newBalance);
        setCheckInStatus((prev) => (prev ? { ...prev, streakDay, checkedInToday: true } : prev));
        showToast(`+${earned} points crédités !`);
      })
      .catch((error) => {
        showAlert('Oups', extractApiErrorMessage(error, "Impossible d'enregistrer le check-in pour l'instant."));
        // Un autre appareil/onglet a peut-être déjà validé le check-in du
        // jour entre-temps (conflit 409) : on resynchronise l'état affiché.
        refreshCheckInStatus();
      })
      .finally(() => setCheckingIn(false));
  }

  useEffect(() => {
    if (isEarnedReward && !rewardHandledRef.current) {
      rewardHandledRef.current = true;
      creditRewardedAdPoints()
        .then(({ balance: newBalance, earned, watchedToday }) => {
          setBalance(newBalance);
          setVideoStatus((prev) => (prev ? { ...prev, watchedToday } : prev));
          showToast(`+${earned} points crédités !`);
        })
        .catch((error) => {
          showAlert('Oups', extractApiErrorMessage(error, "Impossible de créditer la récompense pour l'instant."));
        });
    }
  }, [isEarnedReward]);

  useEffect(() => {
    if (isClosed) {
      rewardHandledRef.current = false;
      load();
    }
  }, [isClosed, load]);

  function handleWatchAd() {
    if (requireAuthOrPrompt()) return;
    if (isLoaded) {
      show();
    } else {
      showAlert('Chargement…', "La publicité n'est pas encore prête, réessayez dans quelques secondes.");
      load();
    }
  }

  // Ouvre le prochain article externe non encore lu ; la lecture elle-même
  // n'est pas vérifiable (contrairement au SDK AdMob), on considère
  // l'ouverture du lien comme suffisante — même modèle de confiance que la
  // pub récompensée.
  function handleReadArticle() {
    if (requireAuthOrPrompt()) return;
    if (!articlesStatus) return;
    const nextArticle = articlesStatus.articles.find((article) => !article.read);
    if (!nextArticle) {
      showAlert('Terminé', 'Vous avez déjà lu les 3 articles disponibles.');
      return;
    }

    Linking.openURL(nextArticle.url).catch(() => {
      showAlert('Oups', "Impossible d'ouvrir cet article pour l'instant.");
    });

    markArticleRead(nextArticle.id)
      .then(({ earned, balance: newBalance }) => {
        setArticlesStatus((prev) =>
          prev ? { articles: prev.articles.map((article) => (article.id === nextArticle.id ? { ...article, read: true } : article)) } : prev,
        );
        if (earned > 0 && newBalance !== undefined) {
          setBalance(newBalance);
          showToast(`+${earned} points crédités !`);
        }
      })
      .catch(() => {
        // Pas d'alerte bloquante : l'article s'est déjà ouvert, le crédit
        // sera simplement retenté à la prochaine tentative.
      });
  }

  if (initialLoading) {
    return <BonusScreenSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <BonusBanner balance={balance} />
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}>
          <CheckInCard status={checkInStatus} checking={checkingIn} onCheckIn={handleCheckIn} />
          {/*<PlaytimeStudioCard />*/}
          {withLiveTaskData(MOCK_BONUS_SECTIONS, videoStatus, articlesStatus, readingTimeStatus).map((section) => (
            <TaskSectionCard key={section.id} section={section} onWatchAd={handleWatchAd} onReadArticle={handleReadArticle} />
          ))}
        </View>
      </ScrollView>
      <Toast message={toastMessage} opacity={toastOpacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  starWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  cta: { paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
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
  toastContainer: { position: 'absolute', left: 0, right: 0, bottom: 32, alignItems: 'center' },
  toastPill: { flexDirection: 'row', alignItems: 'center' },
});

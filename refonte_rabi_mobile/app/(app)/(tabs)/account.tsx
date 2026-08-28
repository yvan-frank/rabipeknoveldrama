import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/auth/auth-store';
import { showAlert } from '../../../src/components/AppAlert';
import { extractApiErrorMessage } from '../../../src/api/client';
import { getPointsBalance } from '../../../src/api/points';
import { getUnreadSupportCount } from '../../../src/api/support';
import { getOrCreateGuestId } from '../../../src/lib/guest-id';
import { unregisterCurrentPushToken } from '../../../src/lib/push-notifications';
import { useTheme } from '../../../src/theme/useTheme';

// Abonnement/gemmes/échange : aucune de ces fonctionnalités n'existe côté
// backend aujourd'hui (cf. exploration — ni /subscriptions, ni système de
// gemmes dans refonte_server). Cet écran en reprend la présentation visuelle
// (comme demandé), mais avec des valeurs à 0 et une alerte "Bientôt
// disponible" au tap plutôt que des boutons silencieusement inertes ou des
// données inventées. Le portefeuille (pièces/bonus), lui, est réel — cf.
// src/api/points.ts.
function MenuRow({
  icon,
  label,
  onPress,
  valueLabel,
  trailingEmoji,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  valueLabel?: string;
  trailingEmoji?: string;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.menuRow, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={[typography.body, { color: colors.ink, flex: 1, marginLeft: spacing.md }]}>{label}</Text>
      {valueLabel ? <Text style={[typography.bodySemiBold, { color: colors.accent, marginRight: 8 }]}>{valueLabel}</Text> : null}
      {trailingEmoji ? <Text style={{ marginRight: 8, fontSize: 16 }}>{trailingEmoji}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function showComingSoon(label: string) {
  showAlert('Bientôt disponible', `${label} arrive prochainement sur Rabipek.`);
}

// L'inscription auteur (register-author) n'existe toujours pas côté mobile
// (ni côté API d'ailleurs, cf. AuthRoutes.php côté serveur) — un compte déjà
// role==='author' a maintenant son espace en natif (cf. app/(app)/author),
// mais un lecteur qui voudrait LE DEVENIR est encore renvoyé vers le site web.
const AUTHOR_CENTER_URL = 'https://rabipeknovel.com/connexion';

function openAuthorCenter() {
  Linking.openURL(AUTHOR_CENTER_URL).catch(() => {
    showAlert('Oups', "Impossible d'ouvrir le centre des auteurs pour l'instant.");
  });
}

export default function AccountScreen() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isGuest = status !== 'authenticated';

  const [guestId, setGuestId] = useState('');
  useEffect(() => {
    if (isGuest) getOrCreateGuestId().then(setGuestId);
  }, [isGuest]);

  const [pointsBalance, setPointsBalance] = useState(0);
  const [bonusCount, setBonusCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  // useFocusEffect (pas un simple useEffect) : cet écran est un onglet, donc
  // reste monté en permanence — sans ça, le solde gagné sur /bonus (autre
  // onglet) ou une réponse support reçue n'auraient jamais été réaffichés
  // ici au retour, seulement au tout premier montage de l'app.
  useFocusEffect(
    useCallback(() => {
      if (isGuest) return;
      getPointsBalance()
        .then(({ balance, bonusCount: count }) => {
          setPointsBalance(balance);
          setBonusCount(count);
        })
        .catch(() => {
          // Écran encore utilisable avec les valeurs déjà connues (ex. hors-ligne).
        });
      getUnreadSupportCount()
        .then(setUnreadSupportCount)
        .catch(() => undefined);
    }, [isGuest]),
  );

  const displayName = isGuest ? 'Visiteur' : (user?.email ?? 'Mon compte');
  const displayId = isGuest ? guestId : `#${user?.id ?? ''}`;

  function handleAuthorCenterPress() {
    if (user?.role === 'author') router.push('/author');
    else openAuthorCenter();
  }

  async function copyId() {
    if (!displayId) return;
    await Clipboard.setStringAsync(displayId);
  }

  // Depuis qu'un visiteur peut naviguer librement (plus de garde globale sur
  // (app), cf. _layout.tsx), se déconnecter ne redirige plus automatiquement
  // vers /login — sans ce router.replace, l'écran se contentait de basculer
  // silencieusement en état "Visiteur" sans aucun retour visible, ce qui
  // donnait l'impression que le bouton ne faisait rien.
  async function handleLogout() {
    try {
      await unregisterCurrentPushToken();
      await logout();
      router.replace('/(app)');
    } catch (err) {
      showAlert('Erreur', extractApiErrorMessage(err, 'Impossible de se déconnecter'));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="person" size={30} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.heading, { color: colors.ink }]} numberOfLines={1}>
                {displayName}
              </Text>
              {displayId ? (
                <Pressable onPress={copyId} style={styles.idRow} hitSlop={6}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>ID {displayId}</Text>
                  <Ionicons name="copy-outline" size={13} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            {isGuest ? (
              <Pressable onPress={() => router.push('/(auth)')} style={[styles.pillButton, { borderColor: colors.accent }]}>
                <Text style={[typography.captionSemiBold, { color: colors.accent }]}>S&apos;identifier</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={[shadow, styles.walletCard, { backgroundColor: colors.surface, borderRadius: radius.lg, marginTop: spacing.lg }]}>
            <View style={styles.walletHeader}>
              <Text style={[typography.bodySemiBold, { color: colors.ink }]}>Mon portefeuille</Text>
              <Pressable onPress={() => showComingSoon('Le détail du portefeuille')} style={styles.walletDetail}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Détail</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.walletBody}>
              <View style={styles.walletStat}>
                <Ionicons name="disc-outline" size={20} color={colors.accent} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[typography.bodySemiBold, { color: colors.ink }]}>{pointsBalance}</Text>
                  <Text style={[typography.label, { color: colors.textMuted }]}>pièces</Text>
                </View>
              </View>
              <View style={[styles.walletStat, { flex: 1 }]}>
                <Ionicons name="star" size={18} color={colors.accent} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[typography.bodySemiBold, { color: colors.ink }]}>{bonusCount}</Text>
                  <Text style={[typography.label, { color: colors.textMuted }]}>bonus</Text>
                </View>
              </View>
              <Pressable onPress={() => showComingSoon('La recharge')} style={[styles.rechargeButton, { backgroundColor: colors.accent }]}>
                <Text style={[typography.captionSemiBold, { color: colors.surface }]}>Recharger</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => showComingSoon("Le centre d'abonnement")}
            style={[styles.subscriptionBanner, { backgroundColor: colors.ink, marginTop: spacing.md }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodySemiBold, { color: colors.surface }]}>💎 Centre d&apos;abonnement</Text>
              <Text style={[typography.caption, { color: colors.surface, opacity: 0.65, marginTop: 2 }]}>
                Plus d&apos;avantages que les recharges
              </Text>
            </View>
            <View style={[styles.subscriptionCta, { backgroundColor: colors.accent }]}>
              <Text style={[typography.captionSemiBold, { color: colors.surface }]}>Allez</Text>
            </View>
          </Pressable>

          <View style={{ marginTop: spacing.lg }}>
            <MenuRow icon="library-outline" label="Bibliothèque" onPress={() => router.push('/library')} />
            <MenuRow
              icon="mail-outline"
              label="Boîte de réception"
              valueLabel={unreadSupportCount > 0 ? String(unreadSupportCount) : undefined}
              onPress={() => router.push('/inbox')}
            />
            <MenuRow
              icon="create-outline"
              label={user?.role === 'author' ? 'Espace auteur' : 'Centre des auteurs'}
              onPress={handleAuthorCenterPress}
            />
            <MenuRow icon="gift-outline" label="Gagner des bonus" trailingEmoji="🎁" onPress={() => router.push('/bonus')} />
            <MenuRow icon="time-outline" label="Vu" onPress={() => router.push('/history')} />
            <MenuRow icon="settings-outline" label="Paramètres" onPress={() => router.push('/settings')} />
          </View>

          {!isGuest ? (
            <Pressable onPress={handleLogout} style={{ marginTop: spacing.xl, alignItems: 'center' }}>
              <Text style={[typography.bodySemiBold, { color: colors.danger }]}>Se déconnecter</Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  pillButton: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  walletCard: { padding: 16 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  walletDetail: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  walletBody: { flexDirection: 'row', alignItems: 'center' },
  walletStat: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  rechargeButton: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  subscriptionBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
  subscriptionCta: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
});

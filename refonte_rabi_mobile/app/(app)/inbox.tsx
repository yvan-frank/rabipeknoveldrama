import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/auth/auth-store';
import { extractApiErrorMessage } from '../../src/api/client';
import { getMyMessages, sendSupportMessage, type SupportMessage } from '../../src/api/support';
import { useTheme } from '../../src/theme/useTheme';

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const isUser = message.sender === 'user';
  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          shadow,
          styles.bubble,
          {
            backgroundColor: isUser ? colors.accent : colors.surface,
            // Un seul coin resserré du côté "pointé" (bas-droite pour moi,
            // bas-gauche pour le support) plutôt qu'une vraie queue de bulle
            // dessinée : même lecture visuelle, design plus épuré.
            borderRadius: radius.lg + 2,
            borderBottomRightRadius: isUser ? 4 : radius.lg + 2,
            borderBottomLeftRadius: isUser ? radius.lg + 2 : 4,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
          },
        ]}
      >
        {!isUser ? <Text style={[typography.label, { color: colors.accent, marginBottom: 3 }]}>Support Rabipek</Text> : null}
        <Text style={[typography.body, { color: isUser ? '#FFFFFF' : colors.ink }]}>{message.content}</Text>
        <Text style={[typography.label, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted, marginTop: 4, alignSelf: 'flex-end' }]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// KeyboardAvoidingView (behavior "height" ou "padding") s'est révélé peu
// fiable sur cet écran (rien ne bougeait sur l'appareil de test, quel que
// soit le behavior essayé — cf. historique). On mesure donc la hauteur du
// clavier nous-mêmes via les événements natifs et on l'applique en
// paddingBottom directement, sans dépendre de l'algorithme interne de
// KeyboardAvoidingView.
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSub = Keyboard.addListener(showEvent, (event) => setHeight(event.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

// Un seul fil par utilisateur (cf. support.service.ts côté serveur) : pas de
// liste de conversations à choisir, juste "la" conversation avec le support.
export default function InboxScreen() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const messagesQuery = useQuery({ queryKey: ['support-messages'], queryFn: getMyMessages, enabled: isAuthenticated });

  // Une réponse du support peut arriver pendant que l'app est fermée/en
  // arrière-plan (cf. notification push) : on revérifie à chaque retour sur
  // cet écran plutôt que de se fier uniquement au cache React Query.
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) messagesQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]),
  );

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendSupportMessage(text),
    onSuccess: (message) => {
      setContent('');
      queryClient.setQueryData<SupportMessage[]>(['support-messages'], (current) => [...(current ?? []), message]);
    },
  });

  function handleSend() {
    const text = content.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.guestState, { paddingHorizontal: spacing.lg, backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }]}>
          Connectez-vous pour contacter le support et suivre vos réponses.
        </Text>
        <Button label="S'identifier" onPress={() => router.push('/(auth)')} />
      </View>
    );
  }

  const messages = messagesQuery.data ?? [];
  // Clavier fermé : on réserve l'inset de sécurité du bas (geste/barre de
  // navigation Android, home indicator iOS). Clavier ouvert : sa hauteur
  // mesurée le remplace entièrement (il couvre déjà cette zone).
  const bottomPadding = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: bottomPadding }}>
      <FlatList
        data={messages}
        keyExtractor={(message) => String(message.id)}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={32} color={colors.textMuted} />
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
              {messagesQuery.isLoading
                ? 'Chargement…'
                : messagesQuery.isError
                  ? extractApiErrorMessage(messagesQuery.error, 'Impossible de charger vos messages')
                  : 'Aucun message pour le moment — posez votre question au support.'}
            </Text>
          </View>
        }
      />

      {/* Composeur type WhatsApp : champ pilule flottant + bouton d'envoi rond
          séparé, pas de barre/bordure encadrant toute la ligne. */}
      <View style={styles.composerRow}>
        <View style={[shadow, styles.inputPill, { backgroundColor: colors.surface, borderRadius: radius.pill }]}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[typography.body, { color: colors.ink, maxHeight: 100 }]}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={content.trim().length === 0 || sendMutation.isPending}
          style={[
            shadow,
            styles.sendButton,
            { backgroundColor: colors.accent, borderRadius: radius.pill, opacity: content.trim().length === 0 ? 0.4 : 1 },
          ]}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      {sendMutation.isError ? (
        <Text style={[typography.caption, { color: colors.danger, paddingHorizontal: spacing.lg, paddingTop: spacing.xs }]}>
          {extractApiErrorMessage(sendMutation.error, "Impossible d'envoyer le message")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubble: { maxWidth: '80%' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  inputPill: { flex: 1, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center' },
  sendButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { TextField } from '../../../src/components/TextField';
import { showAlert } from '../../../src/components/AppAlert';
import { WebContinueHint } from '../../../src/components/WebContinueHint';
import { extractApiErrorMessage } from '../../../src/api/client';
import { createBook, fetchCategories, uploadCoverImage } from '../../../src/api/authors';
import type { CategorySummary } from '../../../src/api/books';
import { useTheme } from '../../../src/theme/useTheme';

const WEB_NEW_BOOK_URL = 'https://rabipeknovel.com/espace-auteur/livres/nouveau';

// Formulaire de création simplifié pour mobile : équivalent minimal du
// wizard 5 étapes de refonte_frontend_php/frontend-react/src/islands/BookWizard.tsx
// (titre, résumé, catégorie, prix/gratuit, couverture) — sans les étapes
// "sujets abordés"/introduction/conclusion, hors scope d'un formulaire mobile.
// Seuls titre, couverture et catégorie sont réellement bloquants : le
// résumé et le nombre de pages ne sont qu'indicatifs (cf. BooksSchema::create
// côté serveur, qui les défaut à '' / 0 plutôt que de les exiger) et peuvent
// être complétés plus tard depuis la fiche de gestion du livre.
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <View
      style={[
        shadow,
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
      ]}
    >
      <Text style={[typography.bodySemiBold, { color: colors.ink }]}>{title}</Text>
      {subtitle ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

export default function NewBookScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [title, setTitle] = useState('');
  const [resume, setResume] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState<CategorySummary[] | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        if (list.length > 0) setCategoryId(list[0].id);
      })
      .catch(() => setCategories([]));
  }, []);

  async function pickCover() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Autorisation requise', "Autorisez l'accès aux photos pour choisir une couverture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) setCoverUri(result.assets[0].uri);
  }

  const canSubmit = title.trim().length > 0 && categoryId !== null && coverUri !== null && (isFree || Number(price) > 0);

  async function handleSubmit() {
    if (!coverUri || categoryId === null) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const coverUrl = await uploadCoverImage(coverUri);
      const book = await createBook({
        title: title.trim(),
        resume: resume.trim() || undefined,
        cover: coverUrl,
        pageNumber: Number(pageNumber) || undefined,
        isFree,
        price: isFree ? 0 : Number(price) || 0,
        categoryId,
      });
      router.replace(`/author/book/${book.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de créer ce livre'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <WebContinueHint url={WEB_NEW_BOOK_URL} label="Assistant complet, plus d'options — continuer sur le site web" />

        <Pressable
          onPress={pickCover}
          style={{
            alignSelf: 'center',
            width: 148,
            height: 222,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: coverUri ? colors.accent : colors.border,
            borderStyle: coverUri ? 'solid' : 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: spacing.lg,
          }}
        >
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <>
              <Text style={{ fontSize: 30 }}>📕</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>Couverture</Text>
            </>
          )}
        </Pressable>

        <Section title="Informations">
          <TextField label="Titre" value={title} onChangeText={setTitle} maxLength={255} />
          <TextField
            label="Résumé (facultatif)"
            value={resume}
            onChangeText={setResume}
            multiline
            numberOfLines={4}
            style={{ height: 100, paddingTop: 12 }}
          />
          <TextField label="Nombre de pages (facultatif)" value={pageNumber} onChangeText={setPageNumber} keyboardType="number-pad" />
        </Section>

        <Section title="Catégorie">
          {categories === null ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>Chargement…</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((category) => {
                const active = category.id === categoryId;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentMuted : 'transparent',
                      borderRadius: radius.pill,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={[typography.captionSemiBold, { color: active ? colors.accent : colors.ink }]}>{category.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Section>

        <Section title="Prix">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setIsFree(true)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: isFree ? colors.accent : colors.background,
                borderRadius: radius.md,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={[typography.captionSemiBold, { color: isFree ? colors.surface : colors.ink }]}>Gratuit</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsFree(false)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: !isFree ? colors.accent : colors.background,
                borderRadius: radius.md,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={[typography.captionSemiBold, { color: !isFree ? colors.surface : colors.ink }]}>Payant</Text>
            </Pressable>
          </View>
          {!isFree ? (
            <View style={{ marginTop: spacing.md }}>
              <TextField label="Prix (FCFA)" value={price} onChangeText={setPrice} keyboardType="number-pad" />
            </View>
          ) : null}
        </Section>

        {error ? <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text> : null}

        <Button label="Créer le livre" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

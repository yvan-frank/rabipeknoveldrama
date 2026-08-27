import { useEffect, useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '../../../../../../src/components/Button';
import { TextField } from '../../../../../../src/components/TextField';
import { RichTextEditor } from '../../../../../../src/components/RichTextEditor';
import { WebContinueHint } from '../../../../../../src/components/WebContinueHint';
import { extractApiErrorMessage } from '../../../../../../src/api/client';
import { createChapter, deleteChapter, fetchChapterForManage, updateChapter } from '../../../../../../src/api/authors';
import { useTheme } from '../../../../../../src/theme/useTheme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md }]}>
      <Text style={[typography.bodySemiBold, { color: colors.ink, marginBottom: spacing.md }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function ChapterEditorScreen() {
  const { colors, spacing, typography } = useTheme();
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId: string }>();
  const bookId = Number(id);
  const isCreating = chapterId === 'new';

  const [title, setTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(!isCreating);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isCreating) return;
    fetchChapterForManage(Number(chapterId))
      .then((chapter) => {
        setTitle(chapter.title);
        setChapterNumber(String(chapter.chapterNumber));
        setContent(chapter.content);
      })
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger ce chapitre')))
      .finally(() => setIsLoading(false));
  }, [isCreating, chapterId]);

  const plainTextLength = content.replace(/<[^>]*>/g, '').trim().length;
  const canSubmit = title.trim().length > 0 && plainTextLength > 0 && Number(chapterNumber) > 0;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = { title: title.trim(), chapterNumber: Number(chapterNumber), content };
      if (isCreating) {
        await createChapter({ bookId, ...payload });
      } else {
        await updateChapter(Number(chapterId), payload);
      }
      router.back();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible d'enregistrer ce chapitre"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteChapter(Number(chapterId));
      router.back();
    } catch (err) {
      setIsDeleting(false);
      setError(extractApiErrorMessage(err, 'Impossible de supprimer ce chapitre'));
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: isCreating ? 'Nouveau chapitre' : 'Modifier le chapitre' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
          <WebContinueHint
            url={`https://rabipeknovel.com/espace-auteur/livres/${bookId}`}
            label="Éditeur plus complet — continuer sur le site web"
          />

          <Section title="Chapitre">
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 2 }}>
                <TextField label="Titre" value={title} onChangeText={setTitle} maxLength={255} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="N°" value={chapterNumber} onChangeText={setChapterNumber} keyboardType="number-pad" />
              </View>
            </View>
          </Section>

          <Section title="Contenu">
            <RichTextEditor value={content} onChange={setContent} minHeight={280} />
          </Section>

          {error ? <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text> : null}

          <Button
            label={isCreating ? 'Créer le chapitre' : 'Enregistrer'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit}
          />

          {!isCreating ? (
            <View style={{ marginTop: spacing.lg }}>
              <Button label="Supprimer ce chapitre" variant="danger" onPress={handleDelete} loading={isDeleting} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

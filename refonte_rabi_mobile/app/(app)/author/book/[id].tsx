import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../../src/components/Button';
import { TextField } from '../../../../src/components/TextField';
import { ConfirmDialog } from '../../../../src/components/ConfirmDialog';
import { showToast } from '../../../../src/components/Toast';
import { extractApiErrorMessage } from '../../../../src/api/client';
import { deleteBook, deleteChapter, fetchBookForManage, updateBook, type ManagedBook } from '../../../../src/api/authors';
import type { ChapterSummary } from '../../../../src/api/books';
import { resolveAssetUrl } from '../../../../src/lib/resolve-asset-url';
import { useTheme } from '../../../../src/theme/useTheme';

function ChapterRow({
  chapter,
  bookId,
  onDelete,
}: {
  chapter: ChapterSummary;
  bookId: number;
  onDelete: (chapter: ChapterSummary) => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/author/book/${bookId}/chapter/${chapter.id}`)}
      style={[styles.chapterRow, { borderColor: colors.border }]}
    >
      <Text style={[typography.body, { color: colors.ink, flex: 1 }]} numberOfLines={1}>
        {chapter.chapterNumber}. {chapter.title}
      </Text>
      <Pressable onPress={() => onDelete(chapter)} hitSlop={10} style={{ marginLeft: spacing.sm }}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </Pressable>
  );
}

export default function ManageBookScreen() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = Number(id);

  const [book, setBook] = useState<ManagedBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [resume, setResume] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [chapterToDelete, setChapterToDelete] = useState<ChapterSummary | null>(null);
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);
  const [isBookDeleteConfirmOpen, setIsBookDeleteConfirmOpen] = useState(false);
  const [isDeletingBook, setIsDeletingBook] = useState(false);

  const load = useCallback(() => {
    fetchBookForManage(bookId)
      .then((data) => {
        setBook(data);
        setTitle(data.title);
        setResume(data.resume);
        setError(null);
      })
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger ce livre')));
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSaveInfo() {
    setSaveError(null);
    setIsSaving(true);
    try {
      const updated = await updateBook(bookId, { title: title.trim(), resume: resume.trim() });
      setBook(updated);
      setIsEditing(false);
      showToast('Livre mis à jour');
    } catch (err) {
      setSaveError(extractApiErrorMessage(err, 'Impossible de mettre à jour ce livre'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDeleteChapter() {
    if (!chapterToDelete) return;
    setIsDeletingChapter(true);
    try {
      await deleteChapter(chapterToDelete.id);
      setChapterToDelete(null);
      load();
    } catch (err) {
      showToast(extractApiErrorMessage(err, 'Impossible de supprimer ce chapitre'));
    } finally {
      setIsDeletingChapter(false);
    }
  }

  async function handleConfirmDeleteBook() {
    setIsDeletingBook(true);
    try {
      await deleteBook(bookId);
      router.replace('/author');
    } catch (err) {
      setIsDeletingBook(false);
      showToast(extractApiErrorMessage(err, 'Impossible de supprimer ce livre'));
    }
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, flex: 1, padding: spacing.lg }]}>
        <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>{error}</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, flex: 1 }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const sortedChapters = [...book.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

  return (
    <>
      <Stack.Screen options={{ title: book.title }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.cover, { backgroundColor: colors.surface }]}>
            {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.coverImage} resizeMode="cover" /> : null}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
            <Text style={[typography.title, { color: colors.ink }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {book.isFree ? 'Gratuit' : `${book.price.toLocaleString('fr-FR')} FCFA`}
            </Text>
          </View>
        </View>

        <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
          {isEditing ? (
            <>
              <TextField label="Titre" value={title} onChangeText={setTitle} maxLength={255} />
              <TextField
                label="Résumé (facultatif)"
                value={resume}
                onChangeText={setResume}
                multiline
                numberOfLines={4}
                style={{ height: 100, paddingTop: 12 }}
              />
              {saveError ? <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{saveError}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Annuler" variant="secondary" onPress={() => setIsEditing(false)} disabled={isSaving} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Enregistrer" onPress={handleSaveInfo} loading={isSaving} />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[typography.bodySemiBold, { color: colors.ink, marginBottom: 6 }]}>Résumé</Text>
              <Text style={[typography.body, { color: book.resume ? colors.inkSecondary : colors.textMuted }]}>
                {book.resume || 'Aucun résumé pour l’instant.'}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <Button label="Modifier les infos" variant="secondary" onPress={() => setIsEditing(true)} />
              </View>
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <Text style={[typography.heading, { color: colors.ink }]}>Chapitres ({sortedChapters.length})</Text>
          <Pressable onPress={() => router.push(`/author/book/${bookId}/chapter/new`)}>
            <Ionicons name="add-circle" size={28} color={colors.accent} />
          </Pressable>
        </View>

        {sortedChapters.length === 0 ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>Aucun chapitre pour l&apos;instant.</Text>
        ) : (
          <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md }]}>
            {sortedChapters.map((chapter) => (
              <ChapterRow key={chapter.id} chapter={chapter} bookId={bookId} onDelete={setChapterToDelete} />
            ))}
          </View>
        )}

        <Pressable onPress={() => setIsBookDeleteConfirmOpen(true)} style={{ marginTop: spacing.xxl, alignItems: 'center' }}>
          <Text style={[typography.bodySemiBold, { color: colors.danger }]}>Supprimer ce livre</Text>
        </Pressable>
      </ScrollView>

      <ConfirmDialog
        visible={chapterToDelete !== null}
        title="Supprimer ce chapitre ?"
        message={chapterToDelete ? `« ${chapterToDelete.title} » sera définitivement retiré.` : undefined}
        confirmLabel="Supprimer"
        destructive
        loading={isDeletingChapter}
        onConfirm={handleConfirmDeleteChapter}
        onCancel={() => setChapterToDelete(null)}
      />

      <ConfirmDialog
        visible={isBookDeleteConfirmOpen}
        title="Supprimer ce livre ?"
        message="Le livre et tous ses chapitres seront définitivement supprimés."
        confirmLabel="Supprimer"
        destructive
        loading={isDeletingBook}
        onConfirm={handleConfirmDeleteBook}
        onCancel={() => setIsBookDeleteConfirmOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  cover: { width: 90, height: 130, borderRadius: 10, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});

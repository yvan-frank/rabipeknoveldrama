import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
import { fetchCurrentEpubEdition } from '../api/epub';
import { extractApiErrorMessage } from '../api/client';
import { deleteLocalEpub, downloadEpub, isEpubDownloaded, openEpub } from '../lib/epub-downloads';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { Skeleton } from './Skeleton';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;
}

interface EpubDownloadSectionProps {
  bookId: number;
  bookTitle: string;
}

export function EpubDownloadSection({ bookId }: EpubDownloadSectionProps) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const editionQuery = useQuery({
    queryKey: ['epub-edition', bookId],
    queryFn: () => fetchCurrentEpubEdition(bookId),
  });

  const edition = editionQuery.data;
  const downloaded = edition ? isEpubDownloaded(edition.id) : false;

  async function handleDownload() {
    if (!edition) return;
    setDownloadState('downloading');
    setDownloadError(null);
    try {
      await downloadEpub(edition.id);
      setDownloadState('idle');
    } catch (error) {
      setDownloadState('error');
      setDownloadError(extractApiErrorMessage(error, 'Téléchargement impossible'));
    }
  }

  async function handleOpen() {
    if (!edition) return;
    try {
      await openEpub(edition.id);
    } catch (error) {
      setDownloadError(extractApiErrorMessage(error, "Impossible d'ouvrir l'EPUB"));
    }
  }

  function handleRemove() {
    if (!edition) return;
    deleteLocalEpub(edition.id);
    setDownloadState('idle');
  }

  if (editionQuery.isLoading) {
    return (
      <View style={[shadow, { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Ionicons name="book-outline" size={18} color={colors.ink} />
          <Text style={[typography.bodySemiBold, { color: colors.ink, marginLeft: spacing.xs }]}>Lecture hors-ligne (EPUB)</Text>
        </View>
        <Skeleton height={13} borderRadius={4} style={{ marginBottom: spacing.sm }} />
        <Skeleton height={38} borderRadius={radius.pill} />
      </View>
    );
  }

  return (
    <View
      style={[
        shadow,
        {
          marginTop: spacing.xl,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <Ionicons name="book-outline" size={18} color={colors.ink} />
        <Text style={[typography.bodySemiBold, { color: colors.ink, marginLeft: spacing.xs }]}>
          Lecture hors-ligne (EPUB)
        </Text>
      </View>

      {!edition ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {"Aucune édition EPUB n'est disponible pour ce livre pour le moment."}
        </Text>
      ) : downloaded ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.success }]}>✓ Téléchargé — disponible hors-ligne</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label="Ouvrir" onPress={handleOpen} variant="secondary" />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Supprimer" onPress={handleRemove} variant="secondary" />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Édition v{edition.version}
            {edition.fileSizeBytes ? ` · ${formatSize(edition.fileSizeBytes)}` : ''}
          </Text>
          <Button
            label={downloadState === 'downloading' ? 'Téléchargement…' : 'Télécharger'}
            onPress={handleDownload}
            loading={downloadState === 'downloading'}
          />
        </View>
      )}

      {downloadError ? <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{downloadError}</Text> : null}
      {editionQuery.isFetching && !editionQuery.isLoading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
    </View>
  );
}

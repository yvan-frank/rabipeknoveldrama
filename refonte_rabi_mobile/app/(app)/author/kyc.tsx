import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../src/components/Button';
import { TextField } from '../../../src/components/TextField';
import { showAlert } from '../../../src/components/AppAlert';
import { showToast } from '../../../src/components/Toast';
import { extractApiErrorMessage } from '../../../src/api/client';
import { fetchMyKyc, submitKyc, uploadIdentityDocument, type DocumentType } from '../../../src/api/authors';
import { useTheme } from '../../../src/theme/useTheme';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'cni', label: "Carte nationale d'identité" },
  { value: 'passeport', label: 'Passeport' },
  { value: 'autre', label: 'Autre pièce' },
];

// Port du formulaire KYC web (frontend-react/src/islands/KycForm.tsx) —
// mêmes champs, même endpoint POST /authors/moi/kyc, adapté aux composants
// mobile (pas d'équivalent de CoverUploadField/DocumentUploadField ici, un
// simple bouton + expo-image-picker suffit sur un seul champ document).
export default function KycScreen() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('cni');
  const [documentId, setDocumentId] = useState('');
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMyKyc()
      .then((status) => {
        setIsVerified(status.isVerified);
        const ext = status.extension;
        if (ext) {
          setFullName(ext.fullName ?? '');
          setCountry(ext.country ?? '');
          setAddress(ext.address ?? '');
          setDocumentType(ext.documentType ?? 'cni');
          setDocumentId(ext.documentId ?? '');
          setExistingDocumentUrl(ext.documents);
          setPrivacyAccepted(Boolean(ext.privacyAcceptedAt));
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  async function pickDocument() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Autorisation requise', "Autorisez l'accès aux photos pour importer votre pièce d'identité.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled && result.assets[0]) setDocumentUri(result.assets[0].uri);
  }

  const canSubmit =
    fullName.trim().length > 0 &&
    country.trim().length > 0 &&
    address.trim().length > 0 &&
    documentId.trim().length > 0 &&
    (documentUri !== null || existingDocumentUrl !== null) &&
    privacyAccepted;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const documents = documentUri ? await uploadIdentityDocument(documentUri) : existingDocumentUrl!;
      await submitKyc({
        fullName: fullName.trim(),
        country: country.trim(),
        address: address.trim(),
        documentType,
        documentId: documentId.trim(),
        documents,
        privacyAccepted: true,
      });
      showToast('Dossier envoyé — en attente de vérification');
      router.back();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible d'envoyer votre dossier"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        <Text style={[typography.heading, { color: colors.ink, marginTop: spacing.md, textAlign: 'center' }]}>Identité vérifiée</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
          Votre dossier a été validé — vous pouvez publier librement.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
          Ces informations restent confidentielles — elles servent uniquement à vérifier votre identité avant publication.
        </Text>

        <TextField label="Nom complet" value={fullName} onChangeText={setFullName} autoComplete="name" />
        <TextField label="Pays" value={country} onChangeText={setCountry} />
        <TextField label="Adresse" value={address} onChangeText={setAddress} />

        <Text style={[typography.label, { color: colors.textMuted, marginBottom: 8 }]}>TYPE DE DOCUMENT</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}>
          {DOCUMENT_TYPES.map((option) => {
            const active = option.value === documentType;
            return (
              <Pressable
                key={option.value}
                onPress={() => setDocumentType(option.value)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                  backgroundColor: active ? colors.accentMuted : 'transparent',
                  borderRadius: radius.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={[typography.captionSemiBold, { color: active ? colors.accent : colors.ink }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextField label="Numéro du document" value={documentId} onChangeText={setDocumentId} />

        <Text style={[typography.label, { color: colors.textMuted, marginBottom: 8 }]}>PIÈCE D&apos;IDENTITÉ</Text>
        <Pressable
          onPress={pickDocument}
          style={[
            shadow,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: documentUri || existingDocumentUrl ? 'solid' : 'dashed',
              padding: spacing.md,
              alignItems: 'center',
              marginBottom: spacing.lg,
            },
          ]}
        >
          {documentUri ? (
            <Image source={{ uri: documentUri }} style={{ width: 160, height: 110, borderRadius: 8 }} resizeMode="cover" />
          ) : existingDocumentUrl ? (
            <Text style={[typography.captionSemiBold, { color: colors.accent }]}>Document déjà envoyé — appuyer pour remplacer</Text>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>Importer une photo du document</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => setPrivacyAccepted((value) => !value)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: spacing.lg }}
        >
          <Ionicons
            name={privacyAccepted ? 'checkbox' : 'square-outline'}
            size={22}
            color={privacyAccepted ? colors.accent : colors.textMuted}
          />
          <Text style={[typography.body, { color: colors.inkSecondary, flex: 1 }]}>
            J&apos;accepte que ces informations soient utilisées pour vérifier mon identité.
          </Text>
        </Pressable>

        {error ? <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text> : null}

        <Button label="Envoyer mon dossier" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

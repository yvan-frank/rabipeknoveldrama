import { Linking, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

// Rendu générique pour les 3 pages légales (mentions-legales.tsx, cgv.tsx,
// politique-confidentialite.tsx) — contenu décrit en données plutôt qu'en
// JSX répété, pour la même mise en forme cohérente partout (titres,
// paragraphes, listes, encarts, emails cliquables).
export type LegalBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'contactEmails'; intro: string; emails: string[] }
  | { type: 'callout'; blocks: LegalBlock[] };

function LegalBlockView({ block }: { block: LegalBlock }) {
  const { colors, spacing, radius, typography } = useTheme();

  switch (block.type) {
    case 'heading':
      return (
        <Text style={[typography.bodySemiBold, { color: colors.ink, fontSize: 17, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          {block.text}
        </Text>
      );
    case 'paragraph':
      return (
        <Text style={[typography.body, { color: colors.inkSecondary, marginBottom: spacing.sm, lineHeight: 22 }]}>{block.text}</Text>
      );
    case 'list':
      return (
        <View style={{ marginBottom: spacing.sm }}>
          {block.items.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: 4 }}>
              <Text style={[typography.body, { color: colors.inkSecondary }]}>{'•  '}</Text>
              <Text style={[typography.body, { color: colors.inkSecondary, flex: 1, lineHeight: 22 }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'contactEmails':
      return (
        <Text style={[typography.body, { color: colors.inkSecondary, marginBottom: spacing.sm, lineHeight: 22 }]}>
          {block.intro}{' '}
          {block.emails.map((email, index) => (
            <Text key={email} style={{ color: colors.accent }} onPress={() => Linking.openURL(`mailto:${email}`)}>
              {email}
              {index < block.emails.length - 1 ? ' ou ' : ''}
            </Text>
          ))}
        </Text>
      );
    case 'callout':
      return (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }}>
          {block.blocks.map((inner, index) => (
            <LegalBlockView key={index} block={inner} />
          ))}
        </View>
      );
  }
}

export function LegalPage({ title, blocks }: { title: string; blocks: LegalBlock[] }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={[typography.title, { color: colors.ink, textAlign: 'center', marginBottom: spacing.md }]}>{title}</Text>
      {blocks.map((block, index) => (
        <LegalBlockView key={index} block={block} />
      ))}
    </ScrollView>
  );
}

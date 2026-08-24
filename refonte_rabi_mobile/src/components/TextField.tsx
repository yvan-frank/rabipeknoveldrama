import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, secureTextEntry, ...inputProps }: TextFieldProps) {
  const { colors, spacing, radius, fontFamily } = useTheme();
  // Le champ ne démarre masqué que s'il est réellement un champ mot de passe
  // (secureTextEntry fourni) — pour les autres champs, le bouton n'apparaît pas.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.label, { fontFamily: fontFamily.sansMedium, color: colors.textMuted }]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={[
            styles.input,
            {
              fontFamily: fontFamily.sansRegular,
              borderColor: error ? colors.danger : colors.border,
              color: colors.ink,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingRight: secureTextEntry ? spacing.xl + spacing.sm : spacing.md,
            },
            style,
          ]}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={8}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { fontFamily: fontFamily.sansMedium, color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, marginBottom: 6 },
  inputWrapper: { justifyContent: 'center' },
  input: { height: 48, borderWidth: 1, fontSize: 16 },
  toggle: { position: 'absolute', right: 12, height: 48, justifyContent: 'center' },
  error: { fontSize: 12, marginTop: 4 },
});

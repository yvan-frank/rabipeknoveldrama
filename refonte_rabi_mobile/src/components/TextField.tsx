import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, secureTextEntry, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const { colors, spacing, radius, fontFamily } = useTheme();
  // Le champ ne démarre masqué que s'il est réellement un champ mot de passe
  // (secureTextEntry fourni) — pour les autres champs, le bouton n'apparaît pas.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Halo doux autour du champ au focus — pas de useNativeDriver ici
  // (shadowOpacity/borderColor ne le supportent pas), transition ponctuelle
  // donc sans impact perceptible sur les perfs.
  const focus = useRef(new Animated.Value(0)).current;

  function handleFocus(e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    Animated.timing(focus, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(e);
  }
  function handleBlur(e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
    Animated.timing(focus, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(e);
  }

  const animatedBorderColor = error
    ? colors.danger
    : focus.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] });

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.label, { fontFamily: fontFamily.sansMedium, color: colors.textMuted }]}>{label}</Text>
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderRadius: radius.sm,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
            shadowOpacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
            elevation: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }),
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              fontFamily: fontFamily.sansRegular,
              color: colors.ink,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingRight: secureTextEntry ? spacing.xl + spacing.sm : spacing.md,
            },
            style,
          ]}
          {...inputProps}
        />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.sm, borderWidth: 1.5, borderColor: animatedBorderColor }]} />
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
      </Animated.View>
      {error ? <Text style={[styles.error, { fontFamily: fontFamily.sansMedium, color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, marginBottom: 6 },
  inputWrapper: { justifyContent: 'center' },
  input: { height: 48, fontSize: 16 },
  toggle: { position: 'absolute', right: 12, height: 48, justifyContent: 'center' },
  error: { fontSize: 12, marginTop: 4 },
});

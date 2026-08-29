import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { useTheme } from '../theme/useTheme';

interface ShimmerCtaProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// Enrobe Button d'un reflet lumineux qui balaie le CTA en boucle — réservé au
// bouton principal de login.tsx pour lui donner un côté "premium" sans
// toucher au composant Button partagé (register, etc. restent inchangés).
export function ShimmerCta({ label, onPress, loading, disabled }: ShimmerCtaProps) {
  const { radius } = useTheme();
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled || loading) return undefined;
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, [sweep, disabled, loading]);

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-140, 260] });

  return (
    <View style={{ borderRadius: radius.pill, overflow: 'hidden' }}>
      <Button label={label} onPress={onPress} loading={loading} disabled={disabled} pill />
      {!disabled && !loading ? (
        <Animated.View pointerEvents="none" style={[styles.sweepZone, { transform: [{ translateX }, { rotate: '18deg' }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sweepZone: { position: 'absolute', top: -30, bottom: -30, width: 60 },
});

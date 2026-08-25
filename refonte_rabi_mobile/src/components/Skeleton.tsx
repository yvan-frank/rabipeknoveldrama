import { useEffect, useRef } from 'react';
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  // colors.border par défaut (adapté au thème) ; certains contextes toujours
  // sombres (ex. bulles de commentaires) doivent forcer une couleur fixe.
  color?: string;
}

// Pastille de contenu qui pulse doucement (opacity 0.4↔1) pendant le
// chargement — remplace un ActivityIndicator isolé par une forme qui annonce
// déjà la mise en page réelle, pour éviter le saut visuel à l'arrivée des
// données. Une seule primitive, composée différemment par écran.
export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style, color }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: color ?? colors.border, opacity }, style]} />
  );
}

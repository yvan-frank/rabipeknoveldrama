import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface StarRatingProps {
  rating: number;
  size?: number;
  onChange?: (rating: number) => void;
}

// Affichage seul si onChange est omis ; sinon chaque étoile devient
// tapable pour composer la note (1 à 5).
export function StarRating({ rating, size = 18, onChange }: StarRatingProps) {
  const { colors } = useTheme();
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((value) => {
        const filled = value <= Math.round(rating);
        const star = <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={colors.accent} />;
        if (!onChange) return <View key={value}>{star}</View>;
        return (
          <Pressable key={value} onPress={() => onChange(value)} hitSlop={6}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

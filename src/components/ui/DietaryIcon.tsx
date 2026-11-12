import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export interface DietaryIconProps {
  isVeg: boolean;
  size?: number;
  style?: ViewStyle;
}

export const DietaryIcon: React.FC<DietaryIconProps> = ({ isVeg, size = 15, style }) => {
  const outerBorderColor = isVeg ? '#16A34A' : '#DC2626';
  const innerColor = isVeg ? '#16A34A' : '#DC2626';
  const innerDotSize = Math.round(size * 0.48);

  return (
    <View
      style={[
        styles.square,
        {
          width: size,
          height: size,
          borderColor: outerBorderColor,
        },
        style,
      ]}
      accessibilityLabel={isVeg ? 'Vegetarian food symbol' : 'Non-Vegetarian food symbol'}
    >
      <View
        style={[
          styles.dot,
          {
            width: innerDotSize,
            height: innerDotSize,
            borderRadius: innerDotSize / 2,
            backgroundColor: innerColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  square: {
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dot: {},
});

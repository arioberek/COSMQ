import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { XStack, Text, useTheme } from "tamagui";

const ACTION_WIDTH = 80;

type SwipeAction = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  label?: string;
};

type SwipeableRowProps = {
  children: ReactNode;
  rightActions?: SwipeAction[];
  enabled?: boolean;
};

export const SwipeableRow = ({
  children,
  rightActions = [],
  enabled = true,
}: SwipeableRowProps) => {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const rightWidth = rightActions.length * ACTION_WIDTH;

  const enabledRef = useRef(enabled);
  const rightActionsRef = useRef(rightActions);
  const rightWidthRef = useRef(rightWidth);

  enabledRef.current = enabled;
  rightActionsRef.current = rightActions;
  rightWidthRef.current = rightWidth;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enabledRef.current) return false;
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && rightActionsRef.current.length > 0) {
          const newX = Math.max(-rightWidthRef.current - 20, gestureState.dx);
          translateX.setValue(newX);
        } else if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx * 0.2);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldOpenRight = gestureState.dx < -rightWidthRef.current / 3;

        if (shouldOpenRight && rightActionsRef.current.length > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(translateX, {
            toValue: -rightWidthRef.current,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  const close = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleActionPress = (action: SwipeAction) => {
    close();
    setTimeout(() => {
      action.onPress();
    }, 200);
  };

  const actionsOpacity = translateX.interpolate({
    inputRange: [-rightWidth, -rightWidth / 2, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  if (rightActions.length === 0 || !enabled) {
    return <View>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.actionsContainer,
          {
            opacity: actionsOpacity,
          },
        ]}
      >
        <XStack height="100%">
          {rightActions.map((action, index) => (
            <Pressable
              key={`${action.icon}-${index}`}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleActionPress(action)}
            >
              <Ionicons name={action.icon} size={22} color={theme.color.val} />
              {action.label && (
                <Text color="$color" fontSize={11} marginTop={2} fontWeight="500">
                  {action.label}
                </Text>
              )}
            </Pressable>
          ))}
        </XStack>
      </Animated.View>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  actionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  contentContainer: {
    backgroundColor: "transparent",
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

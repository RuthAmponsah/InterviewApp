import { Platform, type ScrollViewProps } from "react-native";

export const keyboardAvoidingBehavior = "height";
export const keyboardVerticalOffset = 0;
export const authKeyboardVerticalOffset = Platform.OS === "ios" ? 0 : 0;
export const keyboardDismissMode: NonNullable<ScrollViewProps["keyboardDismissMode"]> =
  Platform.OS === "ios" ? "interactive" : "none";

export const keyboardAwareScrollProps = {
  keyboardShouldPersistTaps: "handled" as const,
  keyboardDismissMode,
} satisfies Pick<ScrollViewProps, "keyboardShouldPersistTaps" | "keyboardDismissMode">;

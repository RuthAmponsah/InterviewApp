import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import getColors from "../theme/colors";

export interface ThemeContextProps {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  colors: ReturnType<typeof getColors>;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "system",
  setTheme: () => {},
  colors: getColors("light"),
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] =
    useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("appTheme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
      }
    })();
  }, []);

  const setTheme = async (value: "light" | "dark" | "system") => {
    setThemeState(value);
    await AsyncStorage.setItem("appTheme", value);
  };

  const colorScheme =
    theme === "system" ? Appearance.getColorScheme() || "light" : theme;

  const colors = getColors(colorScheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

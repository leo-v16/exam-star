"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function TimeThemeSetter() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Check if a preference is already stored in localStorage
    // next-themes uses the key 'theme' by default
    const storedTheme = localStorage.getItem("theme");

    // If no preference is stored (null), or if it's explicitly 'system'
    // We enforce the time-based rule
    if (!storedTheme || storedTheme === "system") {
      const hour = new Date().getHours();
      // 7am (7) to 5pm (17) -> Light
      // Otherwise -> Dark
      const shouldBeLight = hour >= 7 && hour < 17;
      setTheme(shouldBeLight ? "light" : "dark");
    }
  }, [setTheme]);

  return null;
}

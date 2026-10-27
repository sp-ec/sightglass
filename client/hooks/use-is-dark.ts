import { useTheme } from "next-themes"

// resolvedTheme is undefined until hydration, so the first render is treated as light
export function useIsDark() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === "dark"
}

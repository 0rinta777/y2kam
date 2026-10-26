// Built-in filters for now. Each one is a CSS filter string,
// which works both on the live <video> (CSS) and on the canvas (ctx.filter).
// Later these can be loaded from the Appwrite "catalog" table instead.
export const FILTERS = [
  { name: 'none', css: 'none' },
  { name: 'dreamy', css: 'brightness(110%) saturate(80%) contrast(95%)' },
  { name: 'y2k glow', css: 'brightness(115%) saturate(140%) hue-rotate(-10deg)' },
  { name: 'b&w', css: 'grayscale(100%) contrast(110%)' },
  { name: 'vintage', css: 'sepia(40%) saturate(120%) contrast(90%)' },
]

// Default slider values for a new filter (100% = unchanged)
export const DEFAULT_SETTINGS = {
  brightness: 100,
  saturation: 100,
  contrast: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
}

// Turn saved slider values into a CSS filter string
export function toCss(settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  return `brightness(${s.brightness}%) saturate(${s.saturation}%) contrast(${s.contrast}%) hue-rotate(${s.hue}deg) grayscale(${s.grayscale}%) sepia(${s.sepia}%)`
}

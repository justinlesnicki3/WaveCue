// Letter measurements for Shrikhand, read from Shrikhand_400Regular.ttf (as fractions of the
// font size). The spotlight badges use these to size each line exactly, instead of relying on
// SVG `textLength`, which Android doesn't apply reliably.
export const SHRIKHAND = {
  // height of capitals above the baseline
  capTop: 0.681,
  // how far the slanted letters can poke past their spacing on either side
  overhang: 0.118,
  // characters that hang below the baseline, and by how much
  descent: { Q: 0.221, '&': 0.101, ',': 0.154, $: 0.114 },
  // advance width per character
  widths: {
    A: 0.698, B: 0.761, C: 0.692, D: 0.772, E: 0.671, F: 0.631, G: 0.757, H: 0.834, I: 0.404,
    J: 0.59, K: 0.787, L: 0.651, M: 1.035, N: 0.727, O: 0.733, P: 0.683, Q: 0.733, R: 0.759,
    S: 0.689, T: 0.759, U: 0.788, V: 0.733, W: 1.144, X: 0.809, Y: 0.789, Z: 0.734,
    0: 0.711, 1: 0.452, 2: 0.71, 3: 0.722, 4: 0.786, 5: 0.676, 6: 0.723, 7: 0.65, 8: 0.72, 9: 0.735,
    ' ': 0.2, '.': 0.297, "'": 0.259, '-': 0.569, '&': 0.819, '!': 0.361, '?': 0.682, ',': 0.291,
    ':': 0.353, $: 0.655,
  },
  // used for any character not listed above (errs wide so it still fits)
  fallbackWidth: 0.85,
};

// Width of `text` at font size 1
export function measureText(text, metrics = SHRIKHAND) {
  let w = 0;
  for (const ch of text) w += metrics.widths[ch] ?? metrics.fallbackWidth;
  return w;
}

// How far `text` hangs below the baseline at font size 1
export function textDescent(text, metrics = SHRIKHAND) {
  let d = 0;
  for (const ch of text) d = Math.max(d, metrics.descent[ch] ?? 0);
  return d;
}

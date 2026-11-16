// Web build only (Expo picks this file over ClipPlayerOverlay.js on web).
// react-native-youtube-iframe's web version needs react-native-web-webview, which this
// project doesn't install, so importing the real overlay breaks the web bundle. WaveCue
// doesn't ship on web; this keeps the web build working for quick UI previews.
export default function ClipPlayerOverlay() {
  return null;
}

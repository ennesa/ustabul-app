// Google Maps anahtarı kaynak koda yazılmaz; ortamdan okunur.
// Yerel: .env  |  EAS Build: `eas env:create` (GOOGLE_MAPS_API_KEY)
const mapsKey =
  process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  ios: { ...config.ios, config: { ...config.ios?.config, googleMapsApiKey: mapsKey } },
  android: {
    ...config.android,
    config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } },
  },
});

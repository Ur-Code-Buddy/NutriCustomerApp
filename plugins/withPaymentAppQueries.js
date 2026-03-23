const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Android 11+ package visibility: allow Linking.canOpenURL / intents for UPI apps.
 */
function withPaymentAppQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) {
      manifest.queries = [];
    }
    const queries = manifest.queries;
    const schemes = ['tez', 'phonepe', 'paytmmp', 'bhim', 'upi', 'gpay'];
    const intents = schemes.map((scheme) => ({
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      data: [{ $: { 'android:scheme': scheme } }],
    }));
    queries.push({
      intent: intents,
      package: [
        { $: { 'android:name': 'com.google.android.apps.nbu.paisa.user' } },
        { $: { 'android:name': 'com.phonepe.app' } },
        { $: { 'android:name': 'net.one97.paytm' } },
        { $: { 'android:name': 'in.org.npci.upiapp' } },
      ],
    });
    return config;
  });
}

module.exports = withPaymentAppQueries;

const fs = require('fs');
const path = require('path');

/**
 * `google-services.json` in the repo is the default (commit it for EAS — no env needed).
 *
 * Optional EAS-only override: `GOOGLE_SERVICES_JSON` in the Expo dashboard.
 * - Type **File**: build-time value is a path → used as `googleServicesFile`.
 * - Type **String** (raw JSON): only written to disk when `EAS_BUILD` is set (EAS cloud),
 *   so a local `.env` with the same name cannot overwrite your checked-in file.
 */
module.exports = ({ config }) => {
  const env = process.env.GOOGLE_SERVICES_JSON;
  const defaultRel = './google-services.json';
  /** Set on EAS Build workers (cloud and typically local `eas build --local`). */
  const isEasBuild = Boolean(process.env.EAS_BUILD);
  let googleServicesFile = config.android?.googleServicesFile ?? defaultRel;

  if (env && typeof env === 'string') {
    const trimmed = env.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      if (isEasBuild) {
        const out = path.join(__dirname, 'google-services.json');
        fs.writeFileSync(out, trimmed, 'utf8');
        googleServicesFile = defaultRel;
      }
      // Locally: ignore string env — keep the real file on disk (avoids self-overwrites).
    } else {
      googleServicesFile = trimmed;
    }
  }

  const merchantUpiVpa =
    (typeof process.env.EXPO_PUBLIC_MERCHANT_UPI_VPA === 'string' &&
      process.env.EXPO_PUBLIC_MERCHANT_UPI_VPA.trim()) ||
    config.extra?.merchantUpiVpa ||
    '';

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile,
    },
    extra: {
      ...config.extra,
      merchantUpiVpa,
    },
  };
};

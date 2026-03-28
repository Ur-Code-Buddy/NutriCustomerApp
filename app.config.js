const fs = require('fs');
const path = require('path');

/**
 * `google-services.json` in the repo is the default (commit it for EAS — no env needed).
 *
 * Optional EAS-only override: `GOOGLE_SERVICES_JSON` in the Expo dashboard.
 * - Type **File**: build-time value is a path → used as `googleServicesFile`.
 * - Type **String** (raw JSON): only written to disk when `EAS_BUILD` is set (EAS cloud),
 *   so a local `.env` with the same name cannot overwrite your checked-in file.
 *
 * Expo evaluates dynamic config: if the export has an `expo` key, that object is the app config.
 * Returning `{ expo }` avoids accidentally replacing `expo` with `{}` and breaking `extra.eas`.
 */
module.exports = ({ config }) => {
    const env = process.env.GOOGLE_SERVICES_JSON;
    const defaultRel = './google-services.json';
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
        } else {
            googleServicesFile = trimmed;
        }
    }

    const merchantUpiVpa =
        (typeof process.env.EXPO_PUBLIC_MERCHANT_UPI_VPA === 'string' &&
            process.env.EXPO_PUBLIC_MERCHANT_UPI_VPA.trim()) ||
        config.extra?.merchantUpiVpa ||
        '';

    const expo = {
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

    const mapsAndroid = process.env.GOOGLE_MAPS_API_KEY_ANDROID?.trim();
    if (mapsAndroid && expo.android) {
        expo.android = {
            ...expo.android,
            config: {
                ...expo.android.config,
                googleMaps: {
                    ...expo.android.config?.googleMaps,
                    apiKey: mapsAndroid,
                },
            },
        };
    }

    const mapsIos = process.env.GOOGLE_MAPS_API_KEY_IOS?.trim();
    if (mapsIos) {
        expo.ios = {
            ...expo.ios,
            config: { ...expo.ios?.config, googleMapsApiKey: mapsIos },
        };
    }

    return { expo };
};

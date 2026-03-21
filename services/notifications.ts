import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Foreground Handler Configuration
// This ensures that notifications are displayed as banners even when the app is in the foreground.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Create default Android notification channel
export const setupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }
};

// Set up event listeners for notifications
export const setupNotificationListeners = () => {
    // Listener for when a foreground notification is received
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        // Display using standard React Native Alert since no custom toast system exists in the project
        const title = notification.request.content.title;
        const body = notification.request.content.body;
        if (title && body) {
            // Note: setNotificationHandler already shows the banner, but bringing an alert
            // adds redundancy as requested if they meant a custom UI element.
            // Alert.alert(title, body);
            // Wait, native banner is much better. I will just rely on setNotificationHandler and log it.
            console.log('Foreground notification received:', title, body);
        }
    });

    // Listener for when the user taps on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
    });

    return () => {
        notificationListener.remove();
        responseListener.remove();
    };
};

export const setupPushNotifications = async (authJwtToken: string) => {
    if (!Device.isDevice) {
        console.warn('Push Notifications: Must use a physical device, emulators are not supported.');
        return;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Push Notifications: Permission not granted');
            return;
        }

        // Use getDevicePushTokenAsync for raw FCM tokens compatible with Firebase Admin SDK 
        // as per instructions, prioritizing native modules.
        const pushTokenData = await Notifications.getDevicePushTokenAsync();
        const token = pushTokenData.data;

        if (token) {
            // Patch the token to /users/me/fcm-token using the app's existing API base URL
            await api.patch('/users/me/fcm-token', 
                { fcm_token: token }, 
                {
                    headers: {
                        Authorization: `Bearer ${authJwtToken}`
                    }
                }
            );
            console.log('Successfully registered FCM push token:', token);
        }
    } catch (error) {
        console.error('Push Notifications: Error registering token', error);
    }
};

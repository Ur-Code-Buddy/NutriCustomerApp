declare module 'react-native-razorpay' {
    export default class RazorpayCheckout {
        static open(options: Record<string, unknown>): Promise<Record<string, unknown>>;
    }
}

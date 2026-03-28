import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { emitAuthFailure } from '../lib/authFailure';
import type { OrderTrackingSnapshot } from '../types/orderTracking';

const API_URL =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_BASE_URL) ||
    'https://backend.v1.nutritiffin.com';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor: on 401, clear auth storage and notify (handles expired/invalid tokens)
// Skip logout for PATCH /users/me — 401 there means wrong current_password, not invalid token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isProfileUpdateWrongPassword =
            error.response?.status === 401 &&
            originalRequest?.method === 'patch' &&
            originalRequest?.url?.includes('/users/me');
        if (error.response?.status === 401 && !originalRequest._retried && !isProfileUpdateWrongPassword) {
            originalRequest._retried = true;
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('user_data');
            emitAuthFailure();
        }
        return Promise.reject(error);
    }
);

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const setAuthToken = async (token: string) => {
    if (token) {
        await SecureStore.setItemAsync('access_token', token);
    } else {
        await SecureStore.deleteItemAsync('access_token');
    }
};

export const getAuthToken = async () => {
    return await SecureStore.getItemAsync('access_token');
}

export const authService = {
    login: async (credentials: { username: string; password: string }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData: {
        username: string;
        name: string;
        email: string;
        phone_number: string;
        address: string;
        pincode: string;
        password: string;
    }) => {
        const payload = { ...userData, role: 'CLIENT' };
        const response = await api.post('/auth/register', payload);
        return response.data;
    },
    resendVerification: async (email: string) => {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    },
    checkEmailVerified: async (email: string) => {
        const response = await api.post('/auth/check-email-verified', { email });
        return response.data;
    },
    resendPhoneOtp: async (phone: string) => {
        const response = await api.post('/auth/resend-phone-otp', { phone });
        return response.data;
    },
    verifyPhone: async (phone: string, otp: string) => {
        const response = await api.post('/auth/verify-phone', { phone, otp });
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (email: string, otp: string, newPassword: string) => {
        const response = await api.post('/auth/reset-password', {
            email,
            otp,
            new_password: newPassword,
        });
        return response.data;
    },
    logout: async () => {
        await SecureStore.deleteItemAsync('access_token');
    }
};

export const userService = {
    getProfile: async () => {
        const response = await api.get('/users/me');
        return response.data;
    },
    checkUsername: async (username: string) => {
        const response = await api.get(`/users/check-username/${encodeURIComponent(username)}`);
        return response.data as { exists: boolean };
    },
    updateProfile: async (data: {
        current_password: string;
        address?: string;
        phone_number?: string;
        pincode?: string;
    }) => {
        const response = await api.patch('/users/me', data);
        return response.data;
    }
};

/** GET /charges — platform-wide fees (numbers in rupees). */
export interface PlatformCharges {
    platform_fees: number;
    delivery_fees: number;
    kitchen_fees?: number;
}

let platformChargesCache: PlatformCharges | null = null;

export function isValidPlatformCharges(c: PlatformCharges | null | undefined): c is PlatformCharges {
    if (!c) return false;
    return Number.isFinite(Number(c.platform_fees)) && Number.isFinite(Number(c.delivery_fees));
}

export function getCachedPlatformCharges(): PlatformCharges | null {
    return platformChargesCache;
}

export const chargesService = {
    get: async (): Promise<PlatformCharges> => {
        const response = await api.get<PlatformCharges>('/charges');
        const data = response.data;
        if (isValidPlatformCharges(data)) {
            platformChargesCache = data;
        }
        return data;
    },
};

export const kitchenService = {
    getAll: async () => {
        const response = await api.get('/kitchens');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/kitchens/${id}`);
        return response.data;
    },
    getMenu: async (kitchenId: string) => {
        const response = await api.get(`/menu-items/kitchen/${kitchenId}`);
        return response.data;
    }
};

export const orderService = {
    create: async (orderData: any) => {
        const response = await api.post('/orders', orderData);
        return response.data;
    },
    getMyOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },
    /** GET /orders/:id/tracking — live route snapshot (client: PICKED_UP / OUT_FOR_DELIVERY only). */
    getTracking: async (id: string): Promise<OrderTrackingSnapshot> => {
        const response = await api.get<OrderTrackingSnapshot>(`/orders/${id}/tracking`);
        return response.data;
    },
};

/** Same shape as POST /orders — used for POST /payments/initiate and confirm `originalDto`. */
export type PaymentOrderItemDto = { food_item_id: string; quantity: number };

export type CreatePaymentOrderDto = {
    kitchen_id: string;
    scheduled_for: string;
    items: PaymentOrderItemDto[];
};

export type PaymentInitiateResponse = {
    razorpayOrderId: string;
    publicKey: string;
    /** Paise; when present, must match the Razorpay order — prefer over client-side totals. */
    amount?: number;
};

export type PaymentConfirmBody = {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    originalDto: CreatePaymentOrderDto;
};

function normalizePaymentInitiateResponse(data: Record<string, unknown>): PaymentInitiateResponse {
    const razorpayOrderId = (data.razorpayOrderId ?? data.razorpay_order_id) as string | undefined;
    const publicKey = (data.publicKey ?? data.public_key) as string | undefined;
    if (!razorpayOrderId || !publicKey) {
        throw new Error('Invalid payment initiate response: missing razorpayOrderId or publicKey');
    }
    const rawAmount = data.amount ?? data.amount_paise ?? data.amountPaise;
    const amount =
        rawAmount === undefined || rawAmount === null ? undefined : Number(rawAmount);
    return {
        razorpayOrderId,
        publicKey,
        amount: Number.isFinite(amount) ? amount : undefined,
    };
}

export const paymentService = {
    initiate: async (dto: CreatePaymentOrderDto): Promise<PaymentInitiateResponse> => {
        const response = await api.post<Record<string, unknown>>('/payments/initiate', dto);
        return normalizePaymentInitiateResponse(response.data);
    },
    confirm: async (body: PaymentConfirmBody) => {
        const response = await api.post('/payments/confirm', body);
        return response.data;
    },
};

export default api;

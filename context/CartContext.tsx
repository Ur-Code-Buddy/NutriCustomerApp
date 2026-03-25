import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "./AuthContext";

export interface CartItem {
  item: any;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  kitchenId: string | null;
  kitchenName: string | null;
  addToCart: (
    item: any,
    quantity?: number,
    kitchenId?: string,
    kitchenDisplayName?: string | null,
  ) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalAmount: number;
  count: number;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  kitchenId: null,
  kitchenName: null,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  totalAmount: 0,
  count: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [kitchenId, setKitchenId] = useState<string | null>(null);
  const [kitchenName, setKitchenName] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, [user]);

  const getCartKey = () => {
    if (!user) return null;
    return `cart_${user.id || user.token}`;
  };

  const persistCart = async (
    newItems: CartItem[],
    newKitchenId: string | null,
    newKitchenName: string | null,
  ) => {
    setCartItems(newItems);
    setKitchenId(newKitchenId);
    setKitchenName(newKitchenName);

    const key = getCartKey();
    if (!key) return;

    try {
      if (newItems.length === 0) {
        await SecureStore.deleteItemAsync(key);
        await SecureStore.deleteItemAsync(`${key}_kitchen_id`);
        await SecureStore.deleteItemAsync(`${key}_kitchen_name`);
      } else {
        await SecureStore.setItemAsync(key, JSON.stringify(newItems));
        if (newKitchenId) {
          await SecureStore.setItemAsync(`${key}_kitchen_id`, newKitchenId);
        }
        if (newKitchenName) {
          await SecureStore.setItemAsync(`${key}_kitchen_name`, newKitchenName);
        } else {
          await SecureStore.deleteItemAsync(`${key}_kitchen_name`);
        }
      }
    } catch (error) {
      console.error("Failed to save cart", error);
    }
  };

  const loadCart = async () => {
    const key = getCartKey();
    if (!key) {
      setCartItems([]);
      setKitchenId(null);
      setKitchenName(null);
      return;
    }

    try {
      const savedCart = await SecureStore.getItemAsync(key);
      const savedKitchenId = await SecureStore.getItemAsync(
        `${key}_kitchen_id`,
      );
      const savedKitchenName = await SecureStore.getItemAsync(
        `${key}_kitchen_name`,
      );

      if (savedCart && savedKitchenId) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        setKitchenId(savedKitchenId);
        setKitchenName(savedKitchenName || null);
      } else {
        setCartItems([]);
        setKitchenId(null);
        setKitchenName(null);
      }
    } catch (error) {
      console.error("Failed to load cart", error);
    }
  };

  const addToCart = async (
    item: any,
    quantity = 1,
    kId?: string,
    kitchenDisplayName?: string | null,
  ) => {
    if (!user) {
      Alert.alert(
        "Please login",
        "You need to be logged in to add items to cart.",
      );
      return;
    }

    if (!kId) {
      if (!kitchenId) {
        console.warn("Adding to cart without kitchenId");
        return;
      }
      kId = kitchenId;
    }

    if (kitchenId && kId !== kitchenId) {
      Alert.alert(
        "Replace your cart?",
        "You can only order from one kitchen at a time. Replace the items in your cart with this kitchen?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace cart",
            style: "destructive",
            onPress: async () => {
              const newItems = [{ item, quantity }];
              await persistCart(newItems, kId!, kitchenDisplayName ?? null);
            },
          },
        ],
      );
      return;
    }

    await addItemHelper(item, quantity, kId, kitchenDisplayName);
  };

  const addItemHelper = async (
    item: any,
    quantity: number,
    kId: string,
    kitchenDisplayName?: string | null,
  ) => {
    let newItems = [...cartItems];
    const existingIndex = newItems.findIndex((i) => i.item.id === item.id);

    if (existingIndex >= 0) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({ item, quantity });
    }

    const resolvedName = (kitchenDisplayName ?? kitchenName) ?? null;

    await persistCart(newItems, kId, resolvedName);
  };

  const removeFromCart = async (itemId: string) => {
    const newItems = cartItems.filter((i) => i.item.id !== itemId);
    if (newItems.length === 0) {
      await persistCart([], null, null);
    } else {
      await persistCart(newItems, kitchenId, kitchenName);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const newItems = cartItems.map((i) => {
      if (i.item.id === itemId) {
        return { ...i, quantity };
      }
      return i;
    });

    await persistCart(newItems, kitchenId, kitchenName);
  };

  const clearCart = async () => {
    await persistCart([], null, null);
  };

  const totalAmount = cartItems.reduce(
    (total, { item, quantity }) => total + Number(item.price) * quantity,
    0,
  );
  const count = cartItems.reduce((total, { quantity }) => total + quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        kitchenId,
        kitchenName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

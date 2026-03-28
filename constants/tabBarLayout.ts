/**
 * Layout for the floating pill tab bar (see PillTabBar).
 * Keep in sync when changing the bar’s size or position.
 */
export const PILL_TAB_BAR_HEIGHT = 65;
/** Space between home indicator / screen bottom and pill container */
export const PILL_TAB_BAR_BOTTOM_GAP = 10;
/** Space between last scroll content and top of pill (tap targets + shadow) */
export const PILL_TAB_BAR_CONTENT_GAP = 24;

/**
 * Minimum paddingBottom for ScrollView / FlatList on tab screens so content clears the pill.
 */
export function tabBarContentPaddingBottom(
  safeAreaBottomInset: number,
): number {
  return (
    PILL_TAB_BAR_BOTTOM_GAP +
    safeAreaBottomInset +
    PILL_TAB_BAR_HEIGHT +
    PILL_TAB_BAR_CONTENT_GAP
  );
}

const HIDE_SHADOW_BUFFER = 12;

/** How far to translate the pill down so it clears the screen (scroll-hide animation). */
export function tabBarHideTranslateY(safeAreaBottomInset: number): number {
  return (
    PILL_TAB_BAR_BOTTOM_GAP +
    safeAreaBottomInset +
    PILL_TAB_BAR_HEIGHT +
    HIDE_SHADOW_BUFFER
  );
}

/** Cart preview pill above tab bar (Kitchens). Sync with HomeCartBanner vertical size. */
export const HOME_CART_BANNER_HEIGHT = 64;
export const HOME_CART_BANNER_GAP_ABOVE_TAB = 10;

export function homeCartBannerExtraPadding(hasCart: boolean): number {
  if (!hasCart) return 0;
  return HOME_CART_BANNER_HEIGHT + HOME_CART_BANNER_GAP_ABOVE_TAB;
}

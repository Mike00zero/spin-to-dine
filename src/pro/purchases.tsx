import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

/**
 * Pro is a single one-time unlock (non-consumable), not a subscription.
 * These identifiers must match what's configured in both App Store Connect
 * (the In-App Purchase product) and the RevenueCat dashboard (the entitlement
 * and the package inside the "default" offering):
 *   - Entitlement identifier in RevenueCat: "pro"
 *   - Suggested product id in App Store Connect: "pro_unlock"
 */
const ENTITLEMENT_ID = 'pro';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
/** True once a RevenueCat key is set for this platform. False in local/demo dev — Pro
 * then behaves as "not available" instead of crashing (same pattern as isDemoMode). */
export const isProConfigured = Platform.OS === 'ios' && !!REVENUECAT_IOS_KEY;

/**
 * Testing-only override: when set, every screen sees isPro = true, with no RevenueCat
 * call and no real purchase. Set ONLY via the EAS "preview"/"screenshots" environments —
 * never "production" — so a real App Store build can never ship with this on. Example:
 *   eas env:create --name EXPO_PUBLIC_DEBUG_PRO --value "1" --environment preview
 */
export const isDebugPro = process.env.EXPO_PUBLIC_DEBUG_PRO === '1';

type ProContextValue = {
  /** Whether the user has already unlocked Pro. */
  isPro: boolean;
  /** True until we've checked RevenueCat for the first time. */
  loading: boolean;
  /** The one-time-purchase package to show on the paywall, once loaded. */
  package: PurchasesPackage | null;
  purchasePro: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
};

const ProContext = createContext<ProContextValue | null>(null);

function hasProEntitlement(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(isDebugPro);
  const [loading, setLoading] = useState(!isDebugPro && isProConfigured);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const configured = useRef(false);

  useEffect(() => {
    if (isDebugPro || !isProConfigured || configured.current) return;
    configured.current = true;

    Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
    Purchases.addCustomerInfoUpdateListener((info) => setIsPro(hasProEntitlement(info)));

    (async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        setIsPro(hasProEntitlement(info));
        const offerings = await Purchases.getOfferings();
        const offering: PurchasesOffering | null = offerings.current;
        // Prefer a package explicitly marked "lifetime"; fall back to whatever's first
        // in the default offering, since the exact package type is set in the dashboard.
        setPkg(offering?.lifetime ?? offering?.availablePackages[0] ?? null);
      } catch {
        // Network hiccup or not configured yet in the dashboard — paywall just shows
        // no price and a friendly "try again" on purchase.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const purchasePro = async (): Promise<{ success: boolean; error?: string }> => {
    if (isDebugPro) return { success: true }; // already unlocked for testing
    if (!isProConfigured) return { success: false, error: 'Pro isn’t available in this build yet.' };
    if (!pkg) return { success: false, error: 'Pro isn’t set up yet — try again in a moment.' };
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const unlocked = hasProEntitlement(customerInfo);
      setIsPro(unlocked);
      return { success: unlocked };
    } catch (e: any) {
      if (e?.userCancelled) return { success: false };
      return { success: false, error: 'Something went wrong with the purchase. Please try again.' };
    }
  };

  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    if (isDebugPro) return { success: true };
    if (!isProConfigured) return { success: false, error: 'Pro isn’t available in this build yet.' };
    try {
      const info = await Purchases.restorePurchases();
      const unlocked = hasProEntitlement(info);
      setIsPro(unlocked);
      return { success: unlocked, error: unlocked ? undefined : 'No previous purchase found for this Apple ID.' };
    } catch {
      return { success: false, error: 'Couldn’t restore purchases right now. Please try again.' };
    }
  };

  const value = useMemo(
    () => ({ isPro, loading, package: pkg, purchasePro, restorePurchases }),
    [isPro, loading, pkg],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro() must be used inside a <ProProvider>');
  return ctx;
}

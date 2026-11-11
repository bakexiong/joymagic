"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getAuthClient } from "@/core/auth/client";
import { User } from "@/shared/models/user";
import { SignModal } from "@/shared/blocks/sign/sign-modal";
import {
  consumePendingLogin,
  trackGoogleAdsConversion,
  trackGoogleTagEvent,
} from "@/shared/lib/google-tag";
import { requestCheckoutSession } from "@/shared/lib/payment-checkout";

export interface ContextValue {
  user: User | null;
  session: any;
  isPending: boolean;
  isCheckSign: boolean;
  isShowSignModal: boolean;
  setIsShowSignModal: (show: boolean) => void;
  isShowDomainMigrationNotice: boolean;
  setIsShowDomainMigrationNotice: (show: boolean) => void;
  isShowPaymentModal: boolean;
  setIsShowPaymentModal: (show: boolean) => void;
  configs: Record<string, string>;
  fetchUserCredits: () => Promise<void>;
  fetchUserInfo: () => Promise<User | null>;
}

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  initialSession?: any;
}) => {
  const [configs, setConfigs] = useState<Record<string, string>>({});

  // sign user
  const [user, setUser] = useState<User | null>(
    (initialSession?.user as User | undefined) ?? null,
  );

  // session
  const [session, setSession] = useState<any>(initialSession);
  const [isPending] = useState(false);

  // is check sign (true during SSR and initial render to avoid hydration mismatch when auth is enabled)
  const isCheckSign = false;

  // show sign modal
  const [isShowSignModal, setIsShowSignModal] = useState(false);

  // show domain migration notice
  const [isShowDomainMigrationNotice, setIsShowDomainMigrationNotice] =
    useState(false);

  // show payment modal
  const [isShowPaymentModal, setIsShowPaymentModal] = useState(false);

  // Track if we've already processed pending checkout to avoid duplicate calls
  const pendingCheckoutProcessed = useRef(false);
  const userInfoRequestRef = useRef<Promise<User | null> | null>(null);
  const lastUserInfoFetchAtRef = useRef(0);
  const loginTrackedRef = useRef(false);

  const fetchConfigs = async function () {
    try {
      const resp = await fetch("/api/config/get-configs", {
        method: "POST",
      });
      if (!resp.ok) {
        throw new Error(`fetch failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setConfigs(data);
    } catch (e) {
      console.log("fetch configs failed:", e);
    }
  };

  const fetchUserCredits = async function () {
    try {
      if (!user) {
        return;
      }

      const resp = await fetch("/api/user/get-user-credits", {
        method: "POST",
      });
      if (!resp.ok) {
        throw new Error(`fetch failed with status: ${resp.status}`);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser({ ...user, credits: data });
    } catch (e) {
      console.log("fetch user credits failed:", e);
    }
  };

  const fetchUserInfo = async function () {
    const now = Date.now();

    if (userInfoRequestRef.current) {
      return userInfoRequestRef.current;
    }

    // 短时间内复用最近一次结果，避免首页多个模块同时触发重复请求
    if (user && now - lastUserInfoFetchAtRef.current < 5000) {
      return user;
    }

    userInfoRequestRef.current = (async () => {
      try {
        const resp = await fetch("/api/user/get-user-info", {
          method: "POST",
        });
        if (!resp.ok) {
          throw new Error(`fetch failed with status: ${resp.status}`);
        }
        const { code, message, data } = await resp.json();
        if (code !== 0) {
          throw new Error(message);
        }

        lastUserInfoFetchAtRef.current = Date.now();
        setUser(data);

        return data as User;
      } catch (e) {
        console.log("fetch user info failed:", e);
        return null;
      } finally {
        userInfoRequestRef.current = null;
      }
    })();

    return userInfoRequestRef.current;
  };

  const showOneTap = async function (configs: Record<string, string>) {
    try {
      const authClient = getAuthClient(configs);
      await authClient.oneTap({
        callbackURL: "/",
        onPromptNotification: (notification: any) => {
          // Handle prompt dismissal silently
          // This callback is triggered when the prompt is dismissed or skipped
          console.log("One Tap prompt notification:", notification);
        },
        // fetchOptions: {
        //   onSuccess: () => {
        //     router.push('/');
        //   },
        // },
      });
    } catch (error) {
      // Silently handle One Tap cancellation errors
      // These errors occur when users close the prompt or decline to sign in
      // Common errors: FedCM NetworkError, AbortError, etc.
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    setSession(initialSession);
    setUser((initialSession?.user as User | undefined) ?? null);
  }, [initialSession]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session?.user) {
      if (!loginTrackedRef.current) {
        const pendingLogin = consumePendingLogin();
        if (pendingLogin) {
          trackGoogleTagEvent("login", {
            method: pendingLogin.method || "unknown",
          });
          trackGoogleAdsConversion("login");
        }
        loginTrackedRef.current = true;
      }
    } else {
      loginTrackedRef.current = false;
    }
  }, [session]);

  useEffect(() => {
    if (session && session.user) {
      setUser(session.user as User);
      fetchUserInfo().then((userInfo) => {
        // Check if there's a pending checkout plan after login
        if (
          typeof window !== "undefined" &&
          userInfo &&
          !pendingCheckoutProcessed.current
        ) {
          const pendingPlanStr = window.localStorage.getItem(
            "pending_checkout_plan",
          );

          if (pendingPlanStr) {
            // Mark as processed immediately to avoid duplicate calls
            pendingCheckoutProcessed.current = true;

            try {
              const planData = JSON.parse(pendingPlanStr);

              // Clear the stored data immediately to avoid duplicate calls
              window.localStorage.removeItem("pending_checkout_plan");
              window.localStorage.removeItem("signin_callback_url");

              // Small delay to ensure user state is fully updated
              setTimeout(() => {
                const params = {
                  product_id: planData.productId,
                  currency: planData.currency,
                  locale: planData.locale,
                  payment_provider: planData.paymentProvider,
                  metadata: planData.metadata,
                  discount_code: planData.discountCode,
                };

                requestCheckoutSession(params, {
                  productId: planData.productId,
                  productName: planData.productName,
                  currency: planData.currency,
                  value:
                    typeof planData.amountValue === "number"
                      ? planData.amountValue
                      : undefined,
                  paymentProvider: planData.paymentProvider,
                  discountCode: planData.discountCode,
                })
                  .then(({ checkoutUrl }) => {
                    window.location.href = checkoutUrl;
                  })
                  .catch((error) => {
                    console.error("Auto checkout failed:", error);
                    // Reset the flag on error so user can retry
                    pendingCheckoutProcessed.current = false;
                  });
              }, 100);
            } catch (error) {
              console.error("Failed to parse pending checkout plan:", error);
              window.localStorage.removeItem("pending_checkout_plan");
              window.localStorage.removeItem("signin_callback_url");
              pendingCheckoutProcessed.current = false;
            }
          }
        }
      });
    } else {
      setUser(null);
      // Reset the flag when user logs out
      pendingCheckoutProcessed.current = false;
      lastUserInfoFetchAtRef.current = 0;
      userInfoRequestRef.current = null;
    }
  }, [session]);
  // one tap initialized
  const oneTapInitialized = useRef(false);

  useEffect(() => {
    if (
      configs &&
      configs.google_client_id &&
      configs.google_one_tap_enabled === "true" &&
      !session &&
      !isPending &&
      !oneTapInitialized.current
    ) {
      oneTapInitialized.current = true;
      showOneTap(configs);
    }
  }, [configs, session, isPending]);

  useEffect(() => {
    if (user && !user.credits) {
      // fetchUserCredits();
    }

    // Also check for pending checkout when user state changes
    // This handles cases where session updates before user info is fetched
    if (
      user &&
      typeof window !== "undefined" &&
      !pendingCheckoutProcessed.current
    ) {
      const pendingPlanStr = window.localStorage.getItem(
        "pending_checkout_plan",
      );

      if (pendingPlanStr) {
        // Mark as processed immediately to avoid duplicate calls
        pendingCheckoutProcessed.current = true;

        try {
          const planData = JSON.parse(pendingPlanStr);

          // Clear the stored data immediately to avoid duplicate calls
          window.localStorage.removeItem("pending_checkout_plan");
          window.localStorage.removeItem("signin_callback_url");

          // Small delay to ensure everything is ready
          setTimeout(() => {
            const params = {
              product_id: planData.productId,
              currency: planData.currency,
              locale: planData.locale,
              payment_provider: planData.paymentProvider,
              metadata: planData.metadata,
              discount_code: planData.discountCode,
            };

            requestCheckoutSession(params, {
              productId: planData.productId,
              productName: planData.productName,
              currency: planData.currency,
              value:
                typeof planData.amountValue === "number"
                  ? planData.amountValue
                  : undefined,
              paymentProvider: planData.paymentProvider,
              discountCode: planData.discountCode,
            })
              .then(({ checkoutUrl }) => {
                window.location.href = checkoutUrl;
              })
              .catch((error) => {
                console.error("Auto checkout failed:", error);
                // Reset the flag on error so user can retry
                pendingCheckoutProcessed.current = false;
              });
          }, 200);
        } catch (error) {
          console.error("Failed to parse pending checkout plan:", error);
          window.localStorage.removeItem("pending_checkout_plan");
          window.localStorage.removeItem("signin_callback_url");
          pendingCheckoutProcessed.current = false;
        }
      }
    } else if (!user) {
      // Reset the flag when user logs out
      pendingCheckoutProcessed.current = false;
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        isPending,
        isCheckSign,
        isShowSignModal,
        setIsShowSignModal,
        isShowDomainMigrationNotice,
        setIsShowDomainMigrationNotice,
        isShowPaymentModal,
        setIsShowPaymentModal,
        configs,
        fetchUserCredits,
        fetchUserInfo,
      }}
    >
      {children}
      <SignModal callbackUrl="/" />
    </AppContext.Provider>
  );
};

import { verifyPassword } from "@/lib/utils/password";
import { db } from "@reelo/db";

export interface CashierLoginData {
  id: string;
  userId: string;
  businessId: string;
  cashierLinkSlug: string;
  user: {
    id: string;
    email: string | null;
    name: string;
  };
}

export interface ValidateCashierLoginParams {
  businessSlug: string;
  cashierSlug: string;
  email: string;
  password: string;
}

export interface ValidateCashierLoginResult {
  success: boolean;
  error?: string;
  cashier?: CashierLoginData;
}

/**
 * Validates cashier login credentials.
 * Passwords are verified against stored bcrypt hashes.
 *
 * @returns Result object with success status and cashier data or error
 */
export async function validateCashierLogin(
  params: ValidateCashierLoginParams,
): Promise<ValidateCashierLoginResult> {
  try {
    const { businessSlug, cashierSlug, email, password } = params;

    // Find business by slug
    const business = await db.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      // Generic error to prevent business enumeration
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    // Find cashier by link slug and business
    const cashier = await db.cashier.findFirst({
      where: {
        cashierLinkSlug: cashierSlug,
        businessId: business.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!cashier) {
      // Generic error to prevent cashier enumeration
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    if (!cashier.isActive) {
      return {
        success: false,
        error: "This cashier account is inactive. Contact your administrator.",
      };
    }

    // Validate email against Cashier.email (unique per business)
    if (cashier.email !== email) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    const passwordMatch = await verifyPassword(password, cashier.password);
    if (!passwordMatch) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    return {
      success: true,
      cashier: {
        id: cashier.id,
        userId: cashier.userId,
        businessId: cashier.businessId,
        cashierLinkSlug: cashier.cashierLinkSlug,
        user: {
          id: cashier.user.id,
          email: cashier.email,
          name: cashier.user.name,
        },
      },
    };
  } catch (error: unknown) {
    console.error("Failed to validate cashier login:", error);
    return {
      success: false,
      error: "Failed to validate credentials",
    };
  }
}

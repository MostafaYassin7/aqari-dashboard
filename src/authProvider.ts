import type { AuthProvider } from "@refinedev/core";
import axios from "axios";
import { API_URL, TOKEN_KEY, PHONE_KEY } from "./config";

export const authProvider: AuthProvider = {
  login: async ({ phone, code }) => {
    // Step 1: send OTP (phone only, no code yet)
    if (phone && !code) {
      try {
        await axios.post(`${API_URL}/auth/send-otp`, { phone });
        localStorage.setItem(PHONE_KEY, phone);
        return {
          success: true,
          redirectTo: `/verify-otp?phone=${encodeURIComponent(phone)}`,
        };
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        return {
          success: false,
          error: {
            name: "OTP Error",
            message: error?.response?.data?.message || "Failed to send OTP",
          },
        };
      }
    }

    // Step 2: verify OTP
    if (phone && code) {
      try {
        const { data } = await axios.post(`${API_URL}/auth/verify-otp`, {
          phone,
          code,
        });
        const token = data?.data?.token || data?.token || data?.access_token;
        if (!token) {
          return {
            success: false,
            error: { name: "Auth Error", message: "No token returned" },
          };
        }

        // Fetch user to verify admin role
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = meRes.data?.data || meRes.data;
        if (user?.role !== "admin" && user?.role !== "ADMIN") {
          return {
            success: false,
            error: {
              name: "Access Denied",
              message: "Admin access required",
            },
          };
        }

        localStorage.setItem(TOKEN_KEY, token);
        return { success: true, redirectTo: "/dashboard" };
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        return {
          success: false,
          error: {
            name: "OTP Error",
            message: error?.response?.data?.message || "Invalid OTP code",
          },
        };
      }
    }

    return {
      success: false,
      error: { name: "Login Error", message: "Phone number is required" },
    };
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PHONE_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { authenticated: false, redirectTo: "/login" };
    }
    try {
      await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { authenticated: true };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // Only log out on explicit 401 — not on network errors, timeouts, etc.
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        return { authenticated: false, redirectTo: "/login" };
      }
      // Network/server error: trust the stored token and stay authenticated
      return { authenticated: true };
    }
  },

  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = data?.data || data;
      return {
        id: user?.id,
        name: user?.name || user?.phone,
        avatar: user?.profilePhoto,
        phone: user?.phone,
        role: user?.role,
      };
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.response?.status === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};

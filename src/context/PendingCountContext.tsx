import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { notification } from "antd";
import { axiosInstance } from "../dataProvider";

interface PendingCountCtx {
  count: number;
  // رقم التراخيص في الانتظار — pending property advertisement licenses count
  licenseCount: number;
  refetchLicenseCount: () => void;
}

const PendingCountContext = createContext<PendingCountCtx>({
  count: 0,
  licenseCount: 0,
  refetchLicenseCount: () => {},
});

export const usePendingCount = () => useContext(PendingCountContext);

export const PendingCountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [count, setCount] = useState(0);
  const [licenseCount, setLicenseCount] = useState(0);
  const prevRef = useRef<number | null>(null);
  const prevLicenseRef = useRef<number | null>(null);

  const fetchCount = async () => {
    try {
      const { data } = await axiosInstance.get("/listings", {
        params: { status: "pending", page: 1, limit: 1 },
      });
      const total: number =
        (data?.data as Record<string, number>)?.total ??
        (data?.data as Record<string, unknown[]>)?.data?.length ??
        0;

      if (prevRef.current !== null && total > prevRef.current) {
        const diff = total - prevRef.current;
        notification.info({
          message: "New Pending Listings",
          description: `${diff} new listing${diff > 1 ? "s" : ""} awaiting review`,
          placement: "topRight",
          duration: 8,
        });
      }
      prevRef.current = total;
      setCount(total);
    } catch {
      // silently fail — don't interrupt the UI
    }
  };

  // Fetches count of pending property advertisement licenses
  // GET /property-advertisement-licenses/pending/count
  // Called on mount and every 60 seconds
  const fetchLicenseCount = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(
        "/property-advertisement-licenses/pending/count"
      );
      // Response: { success: true, data: { count: number } }
      const total: number = (data?.data as Record<string, number>)?.count ?? 0;

      if (prevLicenseRef.current !== null && total > prevLicenseRef.current) {
        const diff = total - prevLicenseRef.current;
        notification.info({
          message: "New Pending Licenses",
          description: `${diff} new license${diff > 1 ? "s" : ""} awaiting review`,
          placement: "topRight",
          duration: 8,
        });
      }
      prevLicenseRef.current = total;
      setLicenseCount(total);
    } catch {
      // silently fail — don't interrupt the UI
    }
  }, []);

  useEffect(() => {
    fetchCount();
    fetchLicenseCount();
    const id = setInterval(() => {
      fetchCount();
      fetchLicenseCount();
    }, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PendingCountContext.Provider
      value={{ count, licenseCount, refetchLicenseCount: fetchLicenseCount }}
    >
      {children}
    </PendingCountContext.Provider>
  );
};

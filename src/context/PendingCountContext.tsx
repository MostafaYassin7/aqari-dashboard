import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { notification } from "antd";
import { axiosInstance } from "../dataProvider";

interface PendingCountCtx {
  count: number;
}

const PendingCountContext = createContext<PendingCountCtx>({ count: 0 });

export const usePendingCount = () => useContext(PendingCountContext);

export const PendingCountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [count, setCount] = useState(0);
  const prevRef = useRef<number | null>(null);

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

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PendingCountContext.Provider value={{ count }}>
      {children}
    </PendingCountContext.Provider>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import type { BaseRecord, GetListResponse } from "@refinedev/core";
import axios from "axios";
import { API_URL, TOKEN_KEY } from "./config";

// Axios instance with auth header
const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Map Refine resource names to API paths
const resourceMap: Record<string, string> = {
  listings: "/listings",
  projects: "/projects",
  users: "/users",
  reports: "/engagement/reports",
  promotions: "/promotions",
  "promotions-types": "/promotions/types",
  transactions: "/wallet/transactions",
  invoices: "/wallet/invoices",
  notifications: "/notifications",
  "listing-categories": "/listing-categories",
};

function getPath(resource: string): string {
  return resourceMap[resource] ?? `/${resource}`;
}

// Parse paginated response - handles both { data: [], meta: {} } and { items: [], total: N }
function parsePaginatedResponse(
  data: unknown
): { data: BaseRecord[]; total: number } {
  if (!data || typeof data !== "object") return { data: [], total: 0 };

  // Raw array
  if (Array.isArray(data)) {
    return { data: data as BaseRecord[], total: data.length };
  }

  const d = data as Record<string, unknown>;

  // Actual API shape: { success, data: { data: [...], total: N, page, pages }, message }
  // Also handles: { data: { items: [], meta: { total } } }
  if (d.data && typeof d.data === "object" && !Array.isArray(d.data)) {
    const inner = d.data as Record<string, unknown>;

    // inner.data is the array, inner.total is the count
    if (Array.isArray(inner.data)) {
      const total =
        typeof inner.total === "number"
          ? inner.total
          : (inner.meta as Record<string, number> | undefined)?.total ??
            (inner.data as unknown[]).length;
      return { data: inner.data as BaseRecord[], total };
    }

    // inner.items array (NestJS paginate style)
    if (Array.isArray(inner.items)) {
      const total =
        typeof inner.total === "number"
          ? inner.total
          : (inner.meta as Record<string, number> | undefined)?.total ??
            (inner.items as unknown[]).length;
      return { data: inner.items as BaseRecord[], total };
    }

    // inner itself is iterable-ish, e.g. { "0": {}, "1": {}, length: 2 }
    if (Array.isArray(inner)) {
      return { data: inner as BaseRecord[], total: inner.length };
    }
  }

  // { data: [...] } — direct array at top level
  if (Array.isArray(d.data)) {
    return { data: d.data as BaseRecord[], total: (d.data as unknown[]).length };
  }

  // { items: [], total: N }
  if (Array.isArray(d.items)) {
    const total =
      typeof d.total === "number"
        ? d.total
        : (d.meta as Record<string, number> | undefined)?.total ??
          (d.items as unknown[]).length;
    return { data: d.items as BaseRecord[], total };
  }

  return { data: [], total: 0 };
}

function unwrapSingle(data: unknown): BaseRecord {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    // { success, data: { ...record }, message } — actual API shape
    if (d.data && typeof d.data === "object" && !Array.isArray(d.data)) {
      return d.data as BaseRecord;
    }
  }
  return data as BaseRecord;
}

// Use any to avoid complex generic variance issues with DataProvider interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dataProvider: any = {
  getList: async ({ resource, pagination, filters, sorters, meta }: any) => {
    const path = (meta?.path as string) ?? getPath(resource);
    const { current = 1, pageSize = 10 } = pagination ?? {};

    const params: Record<string, unknown> = {
      page: current,
      limit: pageSize,
    };

    // Apply filters
    filters?.forEach((filter) => {
      if (filter.operator === "eq" && "value" in filter) {
        params[filter.field] = filter.value;
      }
    });

    // Apply sorters
    if (sorters && sorters.length > 0) {
      params.sortBy = sorters[0].field;
      params.sortOrder = sorters[0].order;
    }

    // Apply meta params
    if (meta?.params) {
      Object.assign(params, meta.params);
    }

    const { data } = await axiosInstance.get(path, { params });
    const parsed = parsePaginatedResponse(data);
    return parsed as GetListResponse<BaseRecord>;
  },

  getOne: async ({ resource, id, meta }) => {
    const path = (meta?.path as string) ?? getPath(resource);
    const { data } = await axiosInstance.get(`${path}/${id}`);
    return { data: unwrapSingle(data) };
  },

  create: async ({ resource, variables, meta }) => {
    const path = (meta?.path as string) ?? getPath(resource);
    const { data } = await axiosInstance.post(path, variables);
    return { data: unwrapSingle(data) };
  },

  update: async ({ resource, id, variables, meta }) => {
    const path = (meta?.path as string) ?? getPath(resource);
    const url = meta?.noId ? path : `${path}/${id}`;
    const method = (meta?.method as string) ?? "patch";
    const { data } = await axiosInstance[method as "patch" | "put"](url, variables);
    return { data: unwrapSingle(data) };
  },

  deleteOne: async ({ resource, id, meta }) => {
    const path = (meta?.path as string) ?? getPath(resource);
    const { data } = await axiosInstance.delete(`${path}/${id}`);
    return { data: unwrapSingle(data) };
  },

  getApiUrl: () => API_URL,

  custom: async ({ url, method, payload, query, headers }) => {
    const { data } = await axiosInstance.request({
      url: url.startsWith("http") ? url : `${API_URL}${url}`,
      method,
      data: payload,
      params: query,
      headers,
    });
    return { data };
  },
};

// Export axios instance for direct use
export { axiosInstance };

import axios, { type AxiosInstance } from 'axios';

/** 接口返回的错误：code 含义见接口文档第 2 节，code 为 0 表示网络问题 */
export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* 浏览器禁用存储时忽略 */
    }
  },
};

export const USER_TOKEN_KEY = 'tour.userToken';
export const USER_INFO_KEY = 'tour.user';
export const ADMIN_TOKEN_KEY = 'tour.adminToken';

interface Result<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 用户端和管理端各用一个请求实例，自动带上各自的令牌。
 * 令牌过期（code 401）时清掉登录状态，跳到对应的登录页。
 */
function createClient(tokenKey: string, onUnauthorized: () => void): AxiosInstance {
  const client = axios.create({ baseURL: '/api', timeout: 30000 });
  client.interceptors.request.use(config => {
    const token = storage.get(tokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    response => {
      const body = response.data as Result<unknown>;
      if (body.code === 0) return response;
      if (body.code === 401) onUnauthorized();
      return Promise.reject(new ApiError(body.code, body.message));
    },
    error => {
      const message = error.code === 'ECONNABORTED' ? '请求超时了，请稍后再试' : '连不上服务器，请确认后端已经启动';
      return Promise.reject(new ApiError(0, message));
    },
  );
  return client;
}

function redirectTo(path: string) {
  const here = window.location.pathname + window.location.search;
  if (window.location.pathname !== path) {
    window.location.assign(`${path}?redirect=${encodeURIComponent(here)}`);
  }
}

const userClient = createClient(USER_TOKEN_KEY, () => {
  storage.set(USER_TOKEN_KEY, null);
  storage.set(USER_INFO_KEY, null);
  redirectTo('/login');
});

const adminClient = createClient(ADMIN_TOKEN_KEY, () => {
  storage.set(ADMIN_TOKEN_KEY, null);
  redirectTo('/admin/login');
});

function wrap(client: AxiosInstance) {
  return {
    get: async <T>(url: string, params?: object) => (await client.get<Result<T>>(url, { params })).data.data,
    post: async <T>(url: string, body?: unknown) => (await client.post<Result<T>>(url, body)).data.data,
    put: async <T>(url: string, body?: unknown) => (await client.put<Result<T>>(url, body)).data.data,
    del: async <T>(url: string) => (await client.delete<Result<T>>(url)).data.data,
  };
}

export const userHttp = wrap(userClient);
export const adminHttp = wrap(adminClient);

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : '出了点问题，请稍后再试';
}

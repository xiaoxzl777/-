import { userHttp } from './http';
import type {
  ChatHistoryItem, ChatReply, Conditions, District, Greeting, LoginResult, PageResult, Plan, Poi, PoiDetail,
  PoiQuery, TripDetail, TripSummary, User,
} from './types';

/** 用户端接口：/api/user/** */

export const authApi = {
  register: (body: { username: string; password: string; nickname?: string }) => userHttp.post<User>('/user/register', body),
  login: (body: { username: string; password: string }) => userHttp.post<LoginResult>('/user/login', body),
  me: () => userHttp.get<User>('/user/me'),
};

export const poiApi = {
  districts: () => userHttp.get<District[]>('/user/districts'),
  list: (query: PoiQuery) => userHttp.get<PageResult<Poi>>('/user/pois', query),
  detail: (id: number | string) => userHttp.get<PoiDetail>(`/user/pois/${id}`),
};

export const chatApi = {
  greeting: () => userHttp.get<Greeting>('/user/chat/greeting'),
  send: (body: { message: string; history: ChatHistoryItem[]; conditions: Conditions | null }) =>
    userHttp.post<ChatReply>('/user/chat', body),
  replan: (conditions: Conditions) => userHttp.post<ChatReply>('/user/plan', { conditions }),
};

export const tripApi = {
  save: (body: { title: string; prompt: string; conditions: Conditions; items: Plan['items']; totalCost: number }) =>
    userHttp.post<number>('/user/trips', body),
  list: (page: number, size: number) => userHttp.get<PageResult<TripSummary>>('/user/trips', { page, size }),
  detail: (id: number | string) => userHttp.get<TripDetail>(`/user/trips/${id}`),
  remove: (id: number) => userHttp.del<void>(`/user/trips/${id}`),
};

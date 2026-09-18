import { adminHttp } from './http';
import type { AiStatus, District, OpenRule, PageResult, Poi, PoiDetail, PoiForm, PoiQuery, PoiStatus } from './types';

/** 管理端接口：/api/admin/** */

export const adminApi = {
  login: (body: { username: string; password: string }) =>
    adminHttp.post<{ token: string; name: string }>('/admin/login', body),
  aiStatus: () => adminHttp.get<AiStatus>('/admin/ai-status'),

  districts: () => adminHttp.get<District[]>('/admin/districts'),
  addDistrict: (body: { name: string; sort: number }) => adminHttp.post<number>('/admin/districts', body),
  updateDistrict: (id: number, body: { name: string; sort: number }) => adminHttp.put<void>(`/admin/districts/${id}`, body),
  deleteDistrict: (id: number) => adminHttp.del<void>(`/admin/districts/${id}`),

  pois: (query: PoiQuery) => adminHttp.get<PageResult<Poi>>('/admin/pois', query),
  poi: (id: number | string) => adminHttp.get<PoiDetail>(`/admin/pois/${id}`),
  addPoi: (body: PoiForm) => adminHttp.post<number>('/admin/pois', body),
  updatePoi: (id: number, body: PoiForm) => adminHttp.put<void>(`/admin/pois/${id}`, body),
  updateStatus: (id: number, status: PoiStatus) => adminHttp.put<void>(`/admin/pois/${id}/status`, { status }),
  replaceOpenRules: (id: number, rules: OpenRule[]) => adminHttp.put<void>(`/admin/pois/${id}/open-rules`, rules),
  addClosedDate: (id: number, body: { date: string; reason?: string }) => adminHttp.post<number>(`/admin/pois/${id}/closed-dates`, body),
  deleteClosedDate: (id: number, dateId: number) => adminHttp.del<void>(`/admin/pois/${id}/closed-dates/${dateId}`),
};

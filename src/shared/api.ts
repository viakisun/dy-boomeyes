// 서버 경계. 화면은 여기만 부른다.
// 실서버가 생기면 USE_MOCK을 false로 두고 BASE_URL에 주소를 넣는다 — 화면은 손대지 않는다.
import * as mock from './mock/server';
import { HttpError } from './http-error';
import type { Alert, Candidate, EquipmentRequest, Site } from './types';

const USE_MOCK = true;
const BASE_URL = '/api';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) return mock.handle(method, path, body) as Promise<T>;

  let response: Response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(0, `${method} ${path} — 서버에 닿지 못했습니다`);
  }
  if (!response.ok) throw new HttpError(response.status, `${method} ${path} — ${response.statusText}`);
  return response.json() as Promise<T>;
}

export const fetchSites = () => call<Site[]>('GET', '/sites');
export const fetchRequests = () => call<EquipmentRequest[]>('GET', '/requests');
export const fetchAlerts = () => call<Alert[]>('GET', '/alerts');
export const fetchCandidates = (requestId: string) => call<Candidate[]>('GET', `/requests/${requestId}/candidates`);
export const assignRequest = (requestId: string, codes: string[]) =>
  call<EquipmentRequest>('POST', `/requests/${requestId}/assign`, { codes });

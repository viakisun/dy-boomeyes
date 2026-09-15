// 서버 경계. 화면은 여기만 부른다.
// 실서버가 생기면 USE_MOCK을 false로 두고 BASE에 주소를 넣는다 — 화면은 손대지 않는다.
import * as mock from './mock/server';
import type { Alert, Candidate, Request, Site } from './types';

const USE_MOCK = true;
const BASE = '/api';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) return mock.request(method, path, body) as Promise<T>;
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${method} ${path}`);
  return res.json();
}

export const getSites = () => call<Site[]>('GET', '/sites');
export const getRequests = () => call<Request[]>('GET', '/requests');
export const getAlerts = () => call<Alert[]>('GET', '/alerts');
export const getCandidates = (reqId: string) => call<Candidate[]>('GET', `/requests/${reqId}/candidates`);
export const assignRequest = (reqId: string, codes: string[]) =>
  call<Request>('POST', `/requests/${reqId}/assign`, { codes });

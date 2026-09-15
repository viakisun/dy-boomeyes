// 서버 경계. 화면은 여기만 부른다.
// 실서버가 생기면 USE_MOCK을 false로 두고 BASE에 주소를 넣는다 — 화면은 손대지 않는다.
import * as mock from './mock/server';
import type { Alert, Candidate, Request, Site } from './types';

const USE_MOCK = true;
const BASE = '/api';

async function call(method: string, path: string, body?: any): Promise<any> {
  if (USE_MOCK) return mock.request(method, path, body);
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${method} ${path}`);
  return res.json();
}

export const getSites = (): Promise<Site[]> => call('GET', '/sites');
export const getRequests = (): Promise<Request[]> => call('GET', '/requests');
export const getAlerts = (): Promise<Alert[]> => call('GET', '/alerts');
export const getCandidates = (reqId: string): Promise<Candidate[]> => call('GET', `/requests/${reqId}/candidates`);
export const assignRequest = (reqId: string, codes: string[]): Promise<Request> =>
  call('POST', `/requests/${reqId}/assign`, { codes });

// 표시 형식 — 서버가 준 문구를 화면 자리에 맞게 다듬는다.

/** 「마지막 수신 7. 3. 오전 08:22」처럼 온 문구에서 접두를 떼어 좁은 칸에 넣는다 */
export const shortLastSeen = (text: string) => text.replace('마지막 수신 ', '').replace(' 수신', '');

export const today = () => new Date().toLocaleDateString('ko-KR');

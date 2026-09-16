// 서버가 거절한 것과 아예 닿지 못한 것을 구분한다. 화면은 status로 문구를 고른다.
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

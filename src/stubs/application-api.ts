import type { Answers } from '../domain/answers';

export interface StubReceipt {
  receiptId: string;
  receivedAt: string;
}

export async function submitApplicationStub(_payload: Answers): Promise<StubReceipt> {
  void _payload;
  await new Promise((resolve) => setTimeout(resolve, 450));
  return {
    receiptId: 'DEMO-RECEIPT',
    receivedAt: 'synthetic',
  };
}

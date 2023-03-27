/** @format */

export type UserOperationEvent = {
  userOpHash: string;
  sender: string;
  paymaster: string;
  nonce: number;
  success: boolean;
  actualGasCost: string;
  actualGasUsed: string;
};

export function getUserOPEvent(events: any): UserOperationEvent {
  const event = events.find((e: any) => e.event === "UserOperationEvent");
  return {
    userOpHash: event.args.userOpHash,
    sender: event.args.sender,
    paymaster: event.args.paymaster,
    nonce: event.args.nonce.toNumber(),
    success: event.args.success,
    actualGasCost: event.args.actualGasCost.toString(),
    actualGasUsed: event.args.actualGasUsed.toString(),
  };
}

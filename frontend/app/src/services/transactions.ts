import { Transaction } from "@mysten/sui/transactions";
import { CONFIG, contractTarget } from "../config";

export const MIST_PER_SUI = 1_000_000_000n;
export const SUBSCRIPTION_FEE_MIST = 10n * MIST_PER_SUI;

export function buildCreateOrganisationTx(args: {
  systemObjectId: string;
  name: string;
}) {
  const tx = new Transaction();
  // systemObjectId is now a shared object (after contract update)
  // tx.object() works for both owned and shared objects in Sui SDK
  tx.moveCall({
    target: contractTarget("create_organisation"),
    arguments: [tx.object(args.systemObjectId), tx.pure.string(args.name)]
  });
  tx.setGasBudget(100_000_000);
  return tx;
}

export function buildRegisterStudentTx(args: {
  orgObjectId: string;
  name: string;
  cardId: string;
  department: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: contractTarget("register_student"),
    arguments: [
      tx.object(args.orgObjectId),
      tx.pure.string(args.name),
      tx.pure.string(args.cardId),
      tx.pure.string(args.department)
    ]
  });
  tx.setGasBudget(100_000_000);
  return tx;
}

export function buildPaySubscriptionTx(args: {
  systemObjectId: string;
  orgObjectId: string;
  feeMist?: bigint;
}) {
  const feeMist = args.feeMist ?? SUBSCRIPTION_FEE_MIST;
  const tx = new Transaction();

  // Create a Coin<SUI> from gas to pass as payment.
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(feeMist)]);

  tx.moveCall({
    target: contractTarget("pay_subscription"),
    arguments: [
      tx.object(args.systemObjectId), // Shared object
      tx.object(args.orgObjectId), // Owned object (organisation)
      paymentCoin,
      tx.object(CONFIG.CLOCK_OBJECT_ID) // Shared object (clock)
    ]
  });
  tx.setGasBudget(150_000_000);
  return tx;
}




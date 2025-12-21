import { Transaction } from "@mysten/sui/transactions";
import { CONFIG, contractTarget } from "@/config";
import { ObjectMetadata } from "@/hooks/use-object-metadata";
import { getObjectReference } from "@/utils/object-reference";

export const MIST_PER_SUI = 1_000_000_000n;
export const SUBSCRIPTION_FEE_MIST = 10n * MIST_PER_SUI;

export function buildCreateOrganisationTx(args: {
  systemObjectId: string;
  name: string;
  systemMetadata?: ObjectMetadata | null;
}) {
  const tx = new Transaction();
  // Use cached metadata if available to avoid network calls
  const systemRef = getObjectReference(tx, args.systemObjectId, args.systemMetadata);
  
  tx.moveCall({
    target: contractTarget("create_organisation"),
    arguments: [systemRef, tx.pure.string(args.name)]
  });
  tx.setGasBudget(100_000_000);
  return tx;
}

export function buildRegisterStudentTx(args: {
  orgObjectId: string;
  name: string;
  cardId: string;
  department: string;
  orgMetadata?: ObjectMetadata | null;
}) {
  const tx = new Transaction();
  // Use cached metadata if available
  const orgRef = getObjectReference(tx, args.orgObjectId, args.orgMetadata);
  
  tx.moveCall({
    target: contractTarget("register_student"),
    arguments: [
      orgRef,
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
  systemMetadata?: ObjectMetadata | null;
  orgMetadata?: ObjectMetadata | null;
  clockMetadata?: ObjectMetadata | null;
}) {
  const feeMist = args.feeMist ?? SUBSCRIPTION_FEE_MIST;
  const tx = new Transaction();

  // Create a Coin<SUI> from gas to pass as payment.
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(feeMist)]);

  // Use cached metadata for all objects to avoid network calls
  const systemRef = getObjectReference(tx, args.systemObjectId, args.systemMetadata);
  const orgRef = getObjectReference(tx, args.orgObjectId, args.orgMetadata);
  const clockRef = getObjectReference(tx, CONFIG.CLOCK_OBJECT_ID, args.clockMetadata);

  tx.moveCall({
    target: contractTarget("pay_subscription"),
    arguments: [
      systemRef, // Shared object (AttendanceSystem)
      orgRef, // Shared object (AttendanceOrganisation)
      paymentCoin,
      clockRef // Shared object (Clock)
    ]
  });
  tx.setGasBudget(150_000_000);
  return tx;
}




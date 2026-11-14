import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BaseError, ContractFunctionRevertedError, type Abi, type Address } from "viem";
import { useAccount, useConfig } from "wagmi";
import { simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ERROR_MESSAGES, explorerTx } from "../lib/protocol";
import { useToasts } from "./useToasts";

export type TxRequest = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
};

/** Turn a viem error into something a user can act on. Custom errors map to plain English. */
export function describeError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name];
      if (name) return `Reverted: ${name}`;
      if (revert.reason) return revert.reason;
    }
    if (err.name === "UserRejectedRequestError" || /rejected|denied/i.test(err.shortMessage)) {
      return "You rejected the request in your wallet.";
    }
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Runs a contract write the safe way: simulate first (so reverts show a clear reason before the wallet
 * opens), send, wait for the receipt, then refresh every on-chain query.
 */
export function useTransactor() {
  const config = useConfig();
  const { address, chainId } = useAccount();
  const queryClient = useQueryClient();
  const { push, update } = useToasts();
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async (label: string, req: TxRequest): Promise<boolean> => {
      if (!address || !chainId) {
        push({ kind: "error", title: "Connect a wallet first" });
        return false;
      }
      setPending(label);
      const id = push({ kind: "pending", title: label, body: "Confirm in your wallet…" });
      try {
        const { request } = await simulateContract(config, { ...req, account: address, chainId } as never);
        const hash = await writeContract(config, request as never);
        update(id, { body: "Waiting for confirmation…", href: explorerTx(chainId, hash) });
        const receipt = await waitForTransactionReceipt(config, { hash, chainId });
        if (receipt.status !== "success") throw new Error("Transaction reverted");
        update(id, { kind: "success", body: "Confirmed", href: explorerTx(chainId, hash) });
        await queryClient.invalidateQueries();
        return true;
      } catch (err) {
        update(id, { kind: "error", body: describeError(err) });
        return false;
      } finally {
        setPending(null);
      }
    },
    [address, chainId, config, push, update, queryClient],
  );

  return { run, pending };
}

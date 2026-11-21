import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { FiX } from "react-icons/fi";
import { lendingPoolAbi } from "../contracts/abis";
import type { Market, Position } from "../hooks/useProtocol";
import { useTransactor } from "../hooks/useTransactor";
import { formatToken, formatUsd } from "../lib/format";
import {
  MAX_UINT,
  maxBorrow,
  maxWithdraw,
  previewAccount,
  toUsd,
  WAD,
  type AccountData,
  type Action,
} from "../lib/math";
import { HealthFactorChange } from "./HealthFactor";
import { TokenIcon } from "./TokenIcon";

const LABELS: Record<Action, string> = { supply: "Supply", withdraw: "Withdraw", borrow: "Borrow", repay: "Repay" };

type Props = {
  pool: `0x${string}`;
  market: Market;
  position: Position;
  account: AccountData;
  initialAction: Action;
  onClose: () => void;
};

export function ActionModal({ pool, market, position, account, initialAction, onClose }: Props) {
  const [action, setAction] = useState<Action>(initialAction);
  const [input, setInput] = useState("");
  const [useMax, setUseMax] = useState(false);
  const { run, pending } = useTransactor();
  const { token, decimals } = market;
  const { address: user } = useAccount();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const countsAsCollateral = position.isCollateral || (position.supplied === 0n && market.ltv > 0);

  const max = useMemo(() => {
    switch (action) {
      case "supply":
        return position.walletBalance;
      case "withdraw":
        return maxWithdraw(account, market.params, position.supplied, market.cash, position.isCollateral);
      case "borrow":
        return maxBorrow(account, market.params, market.cash);
      case "repay":
        return position.debt < position.walletBalance ? position.debt : position.walletBalance;
    }
  }, [action, account, market, position]);

  const amount = useMemo(() => {
    if (useMax) return max;
    try {
      return input ? parseUnits(input, decimals) : 0n;
    } catch {
      return null;
    }
  }, [input, useMax, max, decimals]);

  const preview = amount ? previewAccount(account, action, amount, market.params, action === "supply" ? countsAsCollateral : position.isCollateral) : account;
  const tooMuch = amount !== null && amount > max;

  // Full withdraw / full repay send type(uint256).max so dust interest accrued meanwhile is included.
  const isFullWithdraw = action === "withdraw" && amount === position.supplied && account.debtUsd === 0n;
  const isFullRepay = action === "repay" && amount === position.debt && position.walletBalance > position.debt;
  const sendAmount = isFullWithdraw || isFullRepay ? MAX_UINT : (amount ?? 0n);

  // Repaying everything needs a little extra allowance for interest that accrues before the tx lands.
  const required = action === "supply" ? (amount ?? 0n) : action === "repay" ? (isFullRepay ? (position.debt * 1005n) / 1000n : (amount ?? 0n)) : 0n;
  const needsApproval = required > 0n && position.allowance < required;

  const submit = async () => {
    if (!amount || !user) return;
    if (needsApproval) {
      await run(`Approve ${token.symbol}`, {
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [pool, required],
      });
      return;
    }
    const args =
      action === "borrow"
        ? [token.address, sendAmount]
        : [token.address, sendAmount, user]; // supply(onBehalfOf) / withdraw(to) / repay(onBehalfOf)
    const ok = await run(`${LABELS[action]} ${formatToken(amount, decimals)} ${token.symbol}`, {
      address: pool,
      abi: lendingPoolAbi,
      functionName: action,
      args,
    });
    if (ok) onClose();
  };

  const balanceLine: Record<Action, [string, bigint]> = {
    supply: ["Wallet balance", position.walletBalance],
    withdraw: ["Supplied", position.supplied],
    borrow: ["Available to borrow", max],
    repay: ["Debt", position.debt],
  };
  const [balanceLabel, balanceValue] = balanceLine[action];
  const usdValue = amount ? toUsd(amount, decimals, market.price) : 0n;
  const showHf = account.debtUsd > 0n || action === "borrow";

  let buttonLabel = needsApproval ? `Approve ${token.symbol}` : LABELS[action];
  let disabled = !!pending || !amount || amount === 0n || tooMuch;
  if (amount === null) buttonLabel = "Invalid amount";
  else if (tooMuch) buttonLabel = action === "borrow" ? "Exceeds borrow limit" : "Amount too high";
  else if (action === "borrow" && preview.healthFactor < WAD) {
    buttonLabel = "Would be liquidatable";
    disabled = true;
  }
  if (pending) buttonLabel = pending + "…";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`${LABELS[action]} ${token.symbol}`}
        className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#111] p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenIcon token={token} />
            <h3 className="text-xl">{token.symbol}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div role="tablist" className="mt-5 grid grid-cols-4 gap-1 rounded-full bg-white/5 p-1">
          {(Object.keys(LABELS) as Action[]).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={a === action}
              onClick={() => {
                setAction(a);
                setInput("");
                setUseMax(false);
              }}
              className={`rounded-full py-1.5 text-sm transition ${a === action ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
            >
              {LABELS[a]}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Amount</span>
            <span>
              {balanceLabel}: <span className="font-mono text-gray-200">{formatToken(balanceValue, decimals)}</span>
            </span>
          </div>
          <div className="relative mt-2">
            <input
              className="input pr-20"
              inputMode="decimal"
              placeholder="0.0"
              aria-label="Amount"
              value={useMax ? formatUnits(max, decimals) : input}
              onChange={(e) => {
                setUseMax(false);
                setInput(e.target.value.replace(",", "."));
              }}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-200 hover:bg-white/20"
              onClick={() => setUseMax(true)}
            >
              MAX
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{formatUsd(usdValue)}</p>
        </div>

        <dl className="mt-5 space-y-2 rounded-xl border border-white/5 bg-black/40 p-4 text-sm">
          {showHf && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Health factor</dt>
              <dd>
                <HealthFactorChange from={account.healthFactor} to={preview.healthFactor} />
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-400">Borrow limit</dt>
            <dd className="font-mono">
              {formatUsd(account.borrowLimitUsd)} → {formatUsd(preview.borrowLimitUsd)}
            </dd>
          </div>
          {action === "supply" && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Used as collateral</dt>
              <dd>{countsAsCollateral ? "Yes" : "No"}</dd>
            </div>
          )}
          {action === "repay" && position.walletBalance < position.debt && (
            <p className="pt-1 text-xs text-amber-200">
              Your wallet holds less {token.symbol} than you owe, so MAX repays part of the debt.
            </p>
          )}
          {needsApproval && (
            <p className="pt-1 text-xs text-gray-500">
              Step 1 of 2: approve the pool to move exactly this much {token.symbol}. Then confirm the {LABELS[action].toLowerCase()}.
            </p>
          )}
        </dl>

        <button className="btn-primary mt-5 w-full !py-3 text-base" disabled={disabled} onClick={submit}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

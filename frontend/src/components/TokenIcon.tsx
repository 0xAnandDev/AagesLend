import type { TokenInfo } from "../lib/protocol";

export function TokenIcon({ token, size = 32 }: { token: TokenInfo; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-white"
      style={{ width: size, height: size, background: token.color }}
      aria-hidden
    >
      {token.symbol.replace(/^W/, "").slice(0, 3)}
    </span>
  );
}

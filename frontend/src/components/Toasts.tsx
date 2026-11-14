import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiInfo, FiLoader, FiX } from "react-icons/fi";
import { useToasts } from "../hooks/useToasts";

const ICONS = {
  pending: <FiLoader className="animate-spin text-gray-300" />,
  success: <FiCheckCircle className="text-emerald-400" />,
  error: <FiAlertCircle className="text-red-400" />,
  info: <FiInfo className="text-gray-300" />,
};

export function Toasts() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex gap-3 rounded-xl border border-white/10 bg-[#141414] p-4 shadow-2xl"
        >
          <div className="mt-0.5">{ICONS[t.kind]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{t.title}</p>
            {t.body && <p className="mt-0.5 break-words text-sm text-gray-400">{t.body}</p>}
            {t.href && (
              <a href={t.href} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-gray-300 underline">
                View on Arbiscan <FiExternalLink />
              </a>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-gray-500 hover:text-white" aria-label="Dismiss">
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}

'use client';

export function CopyButton({ targetId }: { targetId: string }) {
  return (
    <button
      onClick={() => {
        const el = document.getElementById(targetId);
        if (el) {
          navigator.clipboard.writeText(el.innerText || el.textContent || '');
        }
      }}
      className="mt-4 text-xs text-blue-300 hover:text-blue-200 cursor-pointer"
    >
      Copy to clipboard
    </button>
  );
}

export function SignOutButton({ action, label = "Sair" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 bg-red-50 px-5 py-3 text-[16px] font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        {label}
      </button>
    </form>
  );
}

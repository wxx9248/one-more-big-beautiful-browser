import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg
            className="h-6 w-6 text-black dark:text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M3 8h18M8 3v5M16 3v5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="12" cy="14" r="2" fill="currentColor" />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-black dark:text-white">
            One-Big-Beautiful Browser
          </span>
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xl text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            AI-Powered Browser Automation
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Transform how you interact with websites. Our AI agent understands
            natural language commands and handles complex web interactions
            automatically—clicking, filling forms, navigating pages, and
            managing multiple tabs with intelligent context awareness.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

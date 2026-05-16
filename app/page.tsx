import { Chat } from "@/components/dashboard/Chat";

export default function Home() {
  return (
    <div className="flex h-dvh w-full flex-col bg-white dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-linear-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570]" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Budget Watchdog
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Chat greeting="Karibu" />
      </main>
    </div>
  );
}

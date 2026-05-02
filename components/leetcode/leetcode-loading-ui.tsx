import {
  PageSkeleton,
  SkeletonBlock,
  SkeletonPanel,
  SkeletonText,
} from "@/components/ui/skeleton";
import { CodeIcon } from "./leetcode-ui";

type LeetcodeLoadingVariant = "problems" | "dashboard" | "stats";

const labels: Record<LeetcodeLoadingVariant, string> = {
  problems: "Loading LeetCode problems",
  dashboard: "Loading LeetCode dashboard",
  stats: "Loading LeetCode stats",
};

function LeetcodeSkeletonHero() {
  return (
    <SkeletonPanel className="overflow-hidden bg-[#0b1423] p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-5">
          <div className="grid h-[5.3rem] w-[5.3rem] shrink-0 place-items-center rounded-[1.35rem] border border-[#8d5cff]/30 bg-[#241746]/80 text-[#8d72ff]">
            <CodeIcon className="h-9 w-9 opacity-55" />
          </div>
          <div className="w-full min-w-0 max-w-3xl">
            <SkeletonBlock className="h-9 w-72 max-w-full" />
            <SkeletonText lines={2} className="mt-5 max-w-2xl" />
          </div>
        </div>
        <SkeletonBlock className="h-14 w-full rounded-xl md:w-80" />
      </div>
    </SkeletonPanel>
  );
}

function LeetcodeSkeletonStats() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {["primary", "success", "info", "warning"].map((tone) => (
        <SkeletonPanel
          key={tone}
          data-testid="leetcode-skeleton-stat"
          className="flex min-h-[8.1rem] items-center gap-6 p-7"
        >
          <SkeletonBlock className="h-[4.85rem] w-[4.85rem] shrink-0 rounded-[1.25rem]" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-3 h-9 w-20" />
            <SkeletonBlock className="mt-4 h-4 w-40" />
          </div>
        </SkeletonPanel>
      ))}
    </section>
  );
}

function LeetcodeSkeletonTable() {
  return (
    <SkeletonPanel className="p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-xl">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonText lines={2} className="mt-4 max-w-md" />
        </div>
        <SkeletonBlock className="h-12 w-full lg:w-80" />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-[#26364d]">
        <div className="grid grid-cols-[5rem_minmax(14rem,1fr)_9rem_10rem_9rem] gap-4 bg-[#111d30] p-5">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="h-4" />
          ))}
        </div>
        <div className="divide-y divide-[#243149] bg-[#101a2a]/60">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[5rem_minmax(14rem,1fr)_9rem_10rem_9rem] gap-4 p-5"
            >
              <SkeletonBlock className="h-5 w-10" />
              <SkeletonBlock className="h-5" />
              <SkeletonBlock className="h-8 rounded-full" />
              <SkeletonBlock className="h-8 rounded-full" />
              <SkeletonBlock className="h-10 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPanel>
  );
}

function LeetcodeStatsSkeletonBody() {
  return (
    <>
      <SkeletonPanel className="p-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div>
            <SkeletonBlock className="h-7 w-44" />
            <SkeletonText lines={2} className="mt-4 max-w-2xl" />
            <div className="mt-6 flex h-44 items-end gap-4">
              {Array.from({ length: 14 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  className="w-full rounded-t-md"
                  style={{ height: `${36 + (index % 5) * 12}%` }}
                />
              ))}
            </div>
          </div>
          <SkeletonPanel className="self-center border-amber-400/25 bg-amber-300/10 p-6">
            <SkeletonBlock className="mx-auto h-4 w-20" />
            <SkeletonBlock className="mx-auto mt-5 h-12 w-24" />
            <SkeletonBlock className="mx-auto mt-4 h-5 w-16" />
          </SkeletonPanel>
        </div>
      </SkeletonPanel>
      <section className="grid gap-7 xl:grid-cols-2">
        <SkeletonPanel className="p-7">
          <SkeletonBlock className="h-7 w-56" />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonPanel key={index} className="p-5">
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="mt-5 h-3 w-full rounded-full" />
                <SkeletonBlock className="mt-5 h-7 w-16" />
              </SkeletonPanel>
            ))}
          </div>
        </SkeletonPanel>
        <SkeletonPanel className="p-7">
          <SkeletonBlock className="h-7 w-44" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="grid grid-cols-[2rem_8rem_minmax(0,1fr)_4rem] items-center gap-4">
                <SkeletonBlock className="h-8 w-8 rounded-full" />
                <SkeletonBlock className="h-5" />
                <SkeletonBlock className="h-3 rounded-full" />
                <SkeletonBlock className="h-5" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
      </section>
    </>
  );
}

export function LeetcodeRouteSkeleton({ variant }: { variant: LeetcodeLoadingVariant }) {
  return (
    <PageSkeleton label={labels[variant]} className="pb-4">
      <LeetcodeSkeletonHero />
      <LeetcodeSkeletonStats />
      {variant === "stats" ? <LeetcodeStatsSkeletonBody /> : <LeetcodeSkeletonTable />}
    </PageSkeleton>
  );
}

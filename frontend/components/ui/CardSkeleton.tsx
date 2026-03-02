import { Skeleton } from "../ui/Skeleton";

export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-xl shadow-sm space-y-3">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
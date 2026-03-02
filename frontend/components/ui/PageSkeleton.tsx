import { CardSkeleton } from "./CardSkeleton";

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="animate-pulse bg-gray-200 h-8 w-1/3 rounded-md" />
        <div className="animate-pulse bg-gray-200 h-4 w-1/4 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
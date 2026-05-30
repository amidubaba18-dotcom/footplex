export default function DashboardSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#e5b186]/20 shadow-sm overflow-hidden animate-pulse">
                    <div className="h-24 md:h-28 bg-[#f5debe]/30" />
                    <div className="p-3 space-y-2">
                        <div className="h-4 bg-[#e5b186]/20 rounded w-3/4" />
                        <div className="h-3 bg-[#e5b186]/15 rounded w-1/2" />
                        <div className="flex gap-2 pt-2">
                            <div className="h-5 bg-[#e5b186]/15 rounded w-16" />
                            <div className="h-5 bg-[#e5b186]/15 rounded w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
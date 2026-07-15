export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-16 px-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-16 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-80 bg-gray-200 rounded" />
        </div>
        <div className="h-20 bg-gray-200 rounded border-3 border-[#121212]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {[1, 0, 2].map(i => (
            <div key={i} className="border-3 border-[#121212] bg-white p-6 rounded space-y-4 flex flex-col items-center">
              <div className={`rounded-full bg-gray-200 border-3 border-[#121212] ${i === 0 ? "w-32 h-32" : "w-24 h-24"}`} />
              <div className="h-5 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-8 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="border-3 border-[#121212] bg-white rounded overflow-hidden shadow-brutal">
          <div className="h-10 bg-gray-800" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-[#121212] flex items-center gap-4">
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ArtistsLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-16 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="h-16 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-80 bg-gray-200 rounded" />
        </div>
        <div className="h-20 bg-gray-200 rounded border-3 border-[#121212]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border-3 border-[#121212] rounded shadow-brutal overflow-hidden">
              <div className="h-28 bg-gray-200" />
              <div className="p-6 pt-0 -mt-8 space-y-3">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-300 border-3 border-white flex-shrink-0" />
                  <div className="pt-10 flex-1 space-y-1">
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3].map(j => <div key={j} className="h-5 w-16 bg-gray-200 rounded" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

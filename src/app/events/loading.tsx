export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-16 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-16 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-96 bg-gray-200 rounded" />
        </div>
        <div className="h-20 bg-gray-200 rounded border-3 border-[#121212]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border-3 border-[#121212] rounded shadow-brutal overflow-hidden">
              <div className="h-48 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-1/4 bg-gray-200 rounded" />
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

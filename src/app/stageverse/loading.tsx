export default function StageVerseLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-16 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="border-3 border-[#121212] bg-gray-200 h-24 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-3 border-[#121212] bg-white rounded p-6 space-y-4">
                <div className="h-40 bg-gray-200 rounded" />
                <div className="h-5 w-2/3 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="border-3 border-[#121212] bg-gray-800 rounded h-64" />
          <div className="border-3 border-[#121212] bg-gray-200 rounded h-48" />
        </div>
      </div>
    </div>
  );
}

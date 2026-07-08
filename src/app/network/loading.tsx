export default function NetworkLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-16 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="border-3 border-[#121212] bg-gray-200 rounded h-64" />
          <div className="border-3 border-[#121212] bg-gray-200 rounded h-16" />
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="h-10 bg-gray-200 rounded border-b-3 border-[#121212]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-3 border-[#121212] bg-white rounded p-6 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-5 w-48 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-16 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-16 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-96 bg-gray-200 rounded" />
        </div>
        <div className="h-12 w-96 bg-gray-200 rounded border-3 border-[#121212]" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-3">
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
              <div className="h-10 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border-3 border-[#121212] bg-gray-800 rounded h-64" />
          <div className="border-3 border-[#121212] bg-white rounded h-64" />
        </div>
      </div>
    </div>
  );
}

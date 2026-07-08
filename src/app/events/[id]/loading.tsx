export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-12 px-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="border-4 border-[#121212] bg-gray-200 rounded h-72" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 w-40 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded border-3 border-[#121212]" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-64 bg-gray-200 rounded border-3 border-[#121212]" />
          </div>
        </div>
      </div>
    </div>
  );
}

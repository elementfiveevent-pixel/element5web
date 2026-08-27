export default function ArtistDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-12 px-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="border-4 border-[#121212] rounded overflow-hidden">
          <div className="h-56 bg-gray-200" />
          <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="w-36 h-36 rounded-full bg-gray-300 -mt-24 border-4 border-white" />
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div className="md:col-span-3 space-y-4">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-8 bg-gray-200 rounded"/>)}</div>
                <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-5 bg-gray-200 rounded"/>)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded border-3 border-[#121212]" />
          <div className="space-y-4">
            <div className="h-36 bg-gray-200 rounded border-3 border-[#121212]" />
            <div className="h-48 bg-gray-200 rounded border-3 border-[#121212]" />
          </div>
        </div>
      </div>
    </div>
  );
}

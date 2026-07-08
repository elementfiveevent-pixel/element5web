import { GraduationCap } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
import CollegeSearch from "@/components/colleges/CollegeSearch";

export default function Colleges() {
  return (
    <>
      <SEOHead 
        title="Find Colleges in India | UniVoid"
        description="Search and discover colleges across all states and districts in India. Filter by location, search by name, and find the perfect college for your education."
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            College Directory
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse through thousands of colleges across India. Select a state to get started.
          </p>
        </div>

        {/* College Search Component */}
        <CollegeSearch />
      </div>
    </>
  );
}
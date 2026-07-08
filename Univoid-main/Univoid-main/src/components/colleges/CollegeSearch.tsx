import { Search, Building2, MapPin, GraduationCap, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollegeSearch } from "@/hooks/useCollegeSearch";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollegeSearch() {
  const {
    selectedState,
    selectedDistrict,
    searchTerm,
    currentPage,
    states,
    districts,
    colleges,
    totalCount,
    totalPages,
    isLoadingStates,
    isLoadingDistricts,
    isLoadingColleges,
    handleStateChange,
    handleDistrictChange,
    handleSearchChange,
    handlePageChange,
    clearFilters,
  } = useCollegeSearch({ pageSize: 20 });

  const hasActiveFilters = selectedState || selectedDistrict || searchTerm;

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Find Colleges
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* State and District Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                State <span className="text-destructive">*</span>
              </label>
              <Select 
                value={selectedState} 
                onValueChange={handleStateChange}
                disabled={isLoadingStates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingStates ? "Loading states..." : "Select a state"} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                District / City
              </label>
              <Select 
                value={selectedDistrict} 
                onValueChange={handleDistrictChange}
                disabled={!selectedState || isLoadingDistricts}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      !selectedState 
                        ? "Select state first" 
                        : isLoadingDistricts 
                          ? "Loading..." 
                          : "All districts"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Districts</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Search College Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={selectedState ? "Type college name..." : "Select a state first"}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
                disabled={!selectedState}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => handleSearchChange("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {!selectedState ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Please select a state to view colleges
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Choose a state from the dropdown above to get started
            </p>
          </CardContent>
        </Card>
      ) : isLoadingColleges ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : colleges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No colleges found
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try adjusting your filters or search term
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalCount)} of{" "}
              <span className="font-medium">{totalCount.toLocaleString()}</span> colleges
            </p>
            {isLoadingColleges && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* College Cards */}
          <div className="space-y-3">
            {colleges.map((college) => (
              <Card key={college.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {college.college_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {college.university}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {college.district}, {college.state}
                        </Badge>
                        {college.college_type && (
                          <Badge variant="outline" className="text-xs">
                            {college.college_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

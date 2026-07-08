import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getCollegeStates, 
  getCollegeDistricts, 
  searchColleges, 
  countColleges,
  type College 
} from "@/services/collegeService";
import { useDebounce } from "@/hooks/useDebounce";

interface UseCollegeSearchOptions {
  pageSize?: number;
}

export function useCollegeSearch(options: UseCollegeSearchOptions = {}) {
  const { pageSize = 50 } = options;
  
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Fetch states
  const { 
    data: states = [], 
    isLoading: isLoadingStates 
  } = useQuery({
    queryKey: ["college-states"],
    queryFn: getCollegeStates,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  
  // Fetch districts when state is selected
  const { 
    data: districts = [], 
    isLoading: isLoadingDistricts 
  } = useQuery({
    queryKey: ["college-districts", selectedState],
    queryFn: () => getCollegeDistricts(selectedState),
    enabled: !!selectedState,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
  
  // Search colleges
  const { 
    data: colleges = [], 
    isLoading: isLoadingColleges,
    isFetching: isFetchingColleges,
  } = useQuery({
    queryKey: ["colleges-search", selectedState, selectedDistrict, debouncedSearch, currentPage],
    queryFn: () => searchColleges({
      state: selectedState || null,
      district: selectedDistrict || null,
      search: debouncedSearch || null,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }),
    enabled: !!selectedState, // Only search when state is selected
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Count total colleges for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["colleges-count", selectedState, selectedDistrict, debouncedSearch],
    queryFn: () => countColleges({
      state: selectedState || null,
      district: selectedDistrict || null,
      search: debouncedSearch || null,
    }),
    enabled: !!selectedState,
    staleTime: 1000 * 60 * 5,
  });
  
  // Reset district and page when state changes
  useEffect(() => {
    setSelectedDistrict("");
    setCurrentPage(1);
  }, [selectedState]);
  
  // Reset page when district or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDistrict, debouncedSearch]);
  
  const totalPages = useMemo(() => 
    Math.ceil(totalCount / pageSize), 
    [totalCount, pageSize]
  );
  
  const handleStateChange = useCallback((state: string) => {
    setSelectedState(state);
  }, []);
  
  const handleDistrictChange = useCallback((district: string) => {
    setSelectedDistrict(district);
  }, []);
  
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const clearFilters = useCallback(() => {
    setSelectedState("");
    setSelectedDistrict("");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);
  
  return {
    // State
    selectedState,
    selectedDistrict,
    searchTerm,
    currentPage,
    
    // Data
    states,
    districts,
    colleges,
    totalCount,
    totalPages,
    
    // Loading states
    isLoadingStates,
    isLoadingDistricts,
    isLoadingColleges: isLoadingColleges || isFetchingColleges,
    
    // Actions
    handleStateChange,
    handleDistrictChange,
    handleSearchChange,
    handlePageChange,
    clearFilters,
  };
}

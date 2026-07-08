import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LookupTable = "lookup_states" | "lookup_cities" | "lookup_universities" | "lookup_branches";

interface LookupItem {
  id: string;
  name: string;
  short_name?: string;
  is_popular?: boolean;
}

interface UseSearchableDataOptions {
  tableName: LookupTable;
  dependencyColumn?: string;
  dependencyValue?: string | null;
  debounceMs?: number;
  limit?: number;
}

// Helper to fetch from dynamic table
async function fetchFromTable(
  tableName: LookupTable,
  searchTerm: string | null,
  dependencyColumn?: string,
  dependencyValue?: string | null,
  limit: number = 20,
  popularOnly: boolean = false
): Promise<LookupItem[]> {
  try {
    // Use any to bypass strict type checking for dynamic tables
    const baseQuery = supabase.from(tableName as any);
    
    let selectQuery = baseQuery.select("id, name, is_popular") as any;

    if (popularOnly) {
      selectQuery = selectQuery.eq("is_popular", true);
    } else if (searchTerm && searchTerm.trim()) {
      selectQuery = selectQuery.ilike("name", `%${searchTerm}%`);
    }

    if (dependencyColumn && dependencyValue) {
      selectQuery = selectQuery.eq(dependencyColumn, dependencyValue);
    }

    const { data, error } = await selectQuery
      .order("is_popular", { ascending: false })
      .order("name")
      .limit(limit);

    if (error) {
      console.error("Fetch error:", error);
      return [];
    }

    return (data || []) as LookupItem[];
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

export function useSearchableData({
  tableName,
  dependencyColumn,
  dependencyValue,
  debounceMs = 300,
  limit = 20,
}: UseSearchableDataOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<LookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popularItems, setPopularItems] = useState<LookupItem[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch popular items on mount (ONLY top 10)
  useEffect(() => {
    const fetchPopular = async () => {
      const data = await fetchFromTable(
        tableName,
        null,
        dependencyColumn,
        dependencyValue,
        10,
        true
      );
      setPopularItems(data);
    };

    fetchPopular();
  }, [tableName, dependencyColumn, dependencyValue]);

  // Debounced search function
  const search = useCallback(
    async (term: string) => {
      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // If empty search, show popular items
      if (!term.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Debounce the API call
      debounceRef.current = setTimeout(async () => {
        const data = await fetchFromTable(
          tableName,
          term,
          dependencyColumn,
          dependencyValue,
          limit,
          false
        );
        setResults(data);
        setIsLoading(false);
      }, debounceMs);
    },
    [tableName, dependencyColumn, dependencyValue, debounceMs, limit]
  );

  // Trigger search when searchTerm changes
  useEffect(() => {
    search(searchTerm);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, search]);

  // Reset when dependency changes
  useEffect(() => {
    setSearchTerm("");
    setResults([]);
  }, [dependencyValue]);

  return {
    searchTerm,
    setSearchTerm,
    results: searchTerm.trim() ? results : popularItems,
    isLoading,
    hasSearched: searchTerm.trim().length > 0,
  };
}

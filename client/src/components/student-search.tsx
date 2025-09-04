import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Student } from "@shared/schema";

interface StudentSearchProps {
  query: string;
  onResults: (results: Student[]) => void;
  onLoading: (loading: boolean) => void;
}

export default function StudentSearch({ query, onResults, onLoading }: StudentSearchProps) {
  const { data: searchResults = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students/search", { q: query }],
    enabled: query.length >= 2,
  });

  const latestCallbacks = useRef({ onResults, onLoading });
  latestCallbacks.current = { onResults, onLoading };

  const prevQuery = useRef(query);
  const prevResults = useRef(searchResults);
  const prevLoading = useRef(isLoading);

  // Only call callbacks when values actually change
  useEffect(() => {
    if (prevLoading.current !== isLoading) {
      latestCallbacks.current.onLoading(isLoading);
      prevLoading.current = isLoading;
    }
  }, [isLoading]);

  useEffect(() => {
    const shouldUpdateResults = 
      prevQuery.current !== query || 
      prevResults.current !== searchResults;

    if (shouldUpdateResults) {
      if (query.length >= 2) {
        latestCallbacks.current.onResults(searchResults);
      } else {
        latestCallbacks.current.onResults([]);
      }
      prevQuery.current = query;
      prevResults.current = searchResults;
    }
  }, [query, searchResults]);

  return null;
}

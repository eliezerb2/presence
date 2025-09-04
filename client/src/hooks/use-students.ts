import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Student, InsertStudent } from "@shared/schema";

export function useStudents() {
  return useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
}

export function useStudentSearch(query: string) {
  return useQuery<Student[]>({
    queryKey: ["/api/students/search", { q: query }],
    enabled: query.length >= 2,
  });
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (student: InsertStudent) => {
      await apiRequest("POST", "/api/students", student);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertStudent> }) => {
      await apiRequest("PATCH", `/api/students/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
}

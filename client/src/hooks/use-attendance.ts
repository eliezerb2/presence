import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Attendance, Student } from "@shared/schema";

type AttendanceWithStudent = Attendance & { student: Student };

export function useAttendance(date?: string) {
  const targetDate = date || format(new Date(), "yyyy-MM-dd");
  
  return useQuery<AttendanceWithStudent[]>({
    queryKey: ["/api/attendance", targetDate],
    queryFn: () => 
      targetDate === format(new Date(), "yyyy-MM-dd") 
        ? fetch("/api/attendance/today").then(res => res.json())
        : fetch(`/api/attendance/${targetDate}`).then(res => res.json()),
  });
}

export function useTodayAttendance() {
  return useQuery<AttendanceWithStudent[]>({
    queryKey: ["/api/attendance/today"],
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("POST", "/api/attendance/check-in", { studentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("POST", "/api/attendance/check-out", { studentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
  });
}

export function useOverrideAttendanceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await apiRequest("PATCH", `/api/attendance/${id}/override`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
  });
}

export function useExportAttendanceCSV() {
  return useMutation({
    mutationFn: async (date: string) => {
      const response = await fetch(`/api/attendance/export/${date}`);
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

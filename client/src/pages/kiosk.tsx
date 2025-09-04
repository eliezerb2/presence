import { useState, useCallback } from "react";
import StudentSearch from "@/components/student-search";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, LogIn, LogOut, Info } from "lucide-react";
import { getHebrewDate } from "@/lib/date-utils";
import { getStatusBadgeClass } from "@/lib/status-utils";
import type { Student, Attendance } from "@shared/schema";

export default function KioskPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(Student & { currentStatus?: string })[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearchResults = useCallback((results: (Student & { currentStatus?: string })[]) => {
    setSearchResults(results);
  }, []);

  const handleSearchLoading = useCallback((loading: boolean) => {
    setIsSearching(loading);
  }, []);

  const checkInMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("POST", "/api/attendance/check-in", { studentId });
    },
    onSuccess: () => {
      toast({
        title: "נרשמה כניסה בהצלחה",
        description: "הנוכחות עודכנה במערכת",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      // Clear search after successful action
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: (error) => {
      toast({
        title: "שגיאה ברישום כניסה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("POST", "/api/attendance/check-out", { studentId });
    },
    onSuccess: () => {
      toast({
        title: "נרשמה יציאה בהצלחה",
        description: "הנוכחות עודכנה במערכת",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      // Clear search after successful action
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: (error) => {
      toast({
        title: "שגיאה ברישום יציאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="text-center mb-8 fade-in">
        <h2 className="text-4xl font-bold text-primary mb-2">ברוכים הבאים</h2>
        <p className="text-xl text-muted-foreground">דווחו על הגעתכם לבית הספר</p>
        <div className="mt-4 text-lg text-foreground">
          <Calendar className="inline ml-2 h-5 w-5 text-primary" />
          <span data-testid="text-current-date">{getHebrewDate()}</span>
        </div>
      </div>

      {/* Search Section */}
      <Card className="p-6 mb-6 fade-in">
        <Label htmlFor="student-search" className="block text-lg font-medium text-foreground mb-4">
          חפש תלמיד לפי מספר, כינוי, שם פרטי או משפחה
        </Label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            id="student-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-2xl p-6 pr-12 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="הקלד כאן..."
            data-testid="input-student-search"
          />
        </div>
      </Card>

      {/* Search Component */}
      <div className="flex-1">
        <StudentSearch
          query={searchQuery}
          onResults={handleSearchResults}
          onLoading={handleSearchLoading}
        />

        {/* No Search State */}
        {!searchQuery && (
          <div className="text-center py-12" data-testid="no-search-state">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">התחל להקליד כדי לחפש תלמיד</p>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="space-y-4" data-testid="search-results">
            {searchResults.map((student) => (
              <Card key={student.id} className="p-6 border border-border hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground" data-testid={`text-student-name-${student.id}`}>
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-muted-foreground">
                      <span data-testid={`text-student-nickname-${student.id}`}>{student.nickname}</span> • 
                      <span data-testid={`text-student-number-${student.id}`}>מס' {student.studentNumber}</span> • 
                      <span data-testid={`text-student-level-${student.id}`}>{student.schoolLevel}</span>
                    </p>
                    <div className="mt-2">
                      <span className={`status-badge ${getStatusBadgeClass(student.currentStatus || "לא דיווח")}`}
                            data-testid={`status-${student.id}`}>
                        {student.currentStatus || "לא דיווח"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-3 mr-6">
                    <Button
                      className="kiosk-button bg-success hover:bg-success/90 text-success-foreground px-8"
                      onClick={() => checkInMutation.mutate(student.id)}
                      disabled={checkInMutation.isPending}
                      data-testid={`button-check-in-${student.id}`}
                    >
                      <LogIn className="ml-3 h-6 w-6" />
                      כניסה
                    </Button>
                    <Button
                      className="kiosk-button bg-warning hover:bg-warning/90 text-warning-foreground px-8"
                      onClick={() => checkOutMutation.mutate(student.id)}
                      disabled={checkOutMutation.isPending}
                      data-testid={`button-check-out-${student.id}`}
                    >
                      <LogOut className="ml-3 h-6 w-6" />
                      יציאה
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* No Results State */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-12" data-testid="no-results-state">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">לא נמצאו תלמידים התואמים את החיפוש</p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12" data-testid="loading-state">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-b-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">מחפש...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t border-border">
        <p className="text-muted-foreground">
          <Info className="inline ml-2 h-4 w-4" />
          זקוקים לעזרה? פנו למזכירות
        </p>
      </div>
    </div>
  );
}

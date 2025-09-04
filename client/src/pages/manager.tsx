import AttendanceTable from "@/components/attendance-table";
import OverrideModal from "@/components/override-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Download, RefreshCw, Check, X, Clock, Calendar, HelpCircle } from "lucide-react";
import { getHebrewDate } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Attendance, Student, Claim } from "@shared/schema";

type AttendanceWithStudent = Attendance & { student: Student };

export default function ManagerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceWithStudent | null>(null);
  const { toast } = useToast();

  // Fetch today's attendance
  const { data: attendanceData = [], isLoading: isLoadingAttendance, refetch } = useQuery<AttendanceWithStudent[]>({
    queryKey: ["/api/attendance/today"],
  });

  // Fetch open claims
  const { data: openClaims = [] } = useQuery<(Claim & { student: Student })[]>({
    queryKey: ["/api/claims/open"],
  });

  // Export CSV mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/attendance/export/${today}`);
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      toast({
        title: "שגיאה ביצוא נתונים",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter attendance data
  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = !searchQuery || 
      record.student.firstName.includes(searchQuery) ||
      record.student.lastName.includes(searchQuery) ||
      record.student.nickname.includes(searchQuery) ||
      record.student.studentNumber.includes(searchQuery);
    
    const matchesStatus = !statusFilter || record.status === statusFilter;
    const matchesLevel = !levelFilter || record.student.schoolLevel === levelFilter;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Calculate statistics
  const stats = {
    present: attendanceData.filter(r => r.status === "נוכח").length,
    absent: attendanceData.filter(r => r.status === "יום לא בא לי").length,
    late: attendanceData.filter(r => r.subStatus === "איחור").length,
    permanentAbsence: attendanceData.filter(r => r.status === "אישור היעדרות קבוע").length,
    notReported: attendanceData.filter(r => r.status === "לא דיווח").length,
  };

  const translateClaimReason = (reason: string) => {
    switch (reason) {
      case "late_threshold": return "חריגת סף איחורים";
      case "third_yom_lo_ba_li": return '״לא בא לי״ שלישי';
      default: return reason;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 md:pb-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">לוח נוכחות יומי</h2>
            <p className="text-muted-foreground">
              <Calendar className="inline ml-2 h-4 w-4" />
              <span data-testid="text-current-date">{getHebrewDate()}</span>
            </p>
          </div>
          <div className="flex items-center space-x-reverse space-x-4 mt-4 lg:mt-0">
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              data-testid="button-export-csv"
            >
              <Download className="ml-2 h-4 w-4" />
              יצוא CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoadingAttendance}
              data-testid="button-refresh-data"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${isLoadingAttendance ? "animate-spin" : ""}`} />
              רענן נתונים
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Check className="text-success h-6 w-6" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-present">{stats.present}</p>
                <p className="text-sm text-muted-foreground">נוכחים</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <X className="text-destructive h-6 w-6" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-absent">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">נעדרים</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="text-warning h-6 w-6" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-late">{stats.late}</p>
                <p className="text-sm text-muted-foreground">איחורים</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Calendar className="text-accent h-6 w-6" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-permanent-absence">{stats.permanentAbsence}</p>
                <p className="text-sm text-muted-foreground">היעדרות קבועה</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center">
                <HelpCircle className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-not-reported">{stats.notReported}</p>
                <p className="text-sm text-muted-foreground">לא דיווח</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-reverse lg:space-x-6">
          <div className="flex-1">
            <Label className="block text-sm font-medium text-foreground mb-2">חיפוש תלמיד</Label>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="שם, מספר תלמיד או כינוי..."
              data-testid="input-filter-search"
            />
          </div>
          <div className="lg:w-48">
            <Label className="block text-sm font-medium text-foreground mb-2">סטטוס</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">כל הסטטוסים</SelectItem>
                <SelectItem value="נוכח">נוכח</SelectItem>
                <SelectItem value="לא דיווח">לא דיווח</SelectItem>
                <SelectItem value="יצא">יצא</SelectItem>
                <SelectItem value="יום לא בא לי">יום לא בא לי</SelectItem>
                <SelectItem value="חיסור מאושר">חיסור מאושר</SelectItem>
                <SelectItem value="אישור היעדרות קבוע">היעדרות קבועה</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:w-48">
            <Label className="block text-sm font-medium text-foreground mb-2">רמת בית ספר</Label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger data-testid="select-level-filter">
                <SelectValue placeholder="כל הרמות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">כל הרמות</SelectItem>
                <SelectItem value="יסודי">יסודי</SelectItem>
                <SelectItem value="תיכון">תיכון</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <AttendanceTable
        data={filteredAttendance}
        onEditRecord={setSelectedRecord}
        isLoading={isLoadingAttendance}
      />

      {/* Monthly Summary and Claims */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            <Calendar className="inline text-primary ml-2 h-5 w-5" />
            סיכום חודשי - {format(new Date(), "MMMM yyyy", { locale: he })}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ממוצע נוכחות</span>
              <span className="font-semibold text-success" data-testid="text-average-attendance">89%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">סה״כ איחורים</span>
              <span className="font-semibold text-warning" data-testid="text-total-late">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">״לא בא לי״ חודשי</span>
              <span className="font-semibold text-destructive" data-testid="text-monthly-yom-lo-ba-li">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">תביעות פתוחות</span>
              <span className="font-semibold text-destructive" data-testid="text-open-claims">{openClaims.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            <X className="inline text-warning ml-2 h-5 w-5" />
            תביעות פתוחות
          </h3>
          <div className="space-y-3" data-testid="list-open-claims">
            {openClaims.length === 0 ? (
              <p className="text-muted-foreground text-sm">אין תביעות פתוחות</p>
            ) : (
              openClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-foreground" data-testid={`text-claim-student-${claim.id}`}>
                      {claim.student.firstName} {claim.student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-claim-reason-${claim.id}`}>
                      {translateClaimReason(claim.reason)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    data-testid={`button-view-claim-${claim.id}`}
                  >
                    צפה
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Override Modal */}
      {selectedRecord && (
        <OverrideModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onSave={() => {
            setSelectedRecord(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function translateClaimReason(reason: string): string {
  switch (reason) {
    case "late_threshold": return "חריגת סף איחורים";
    case "third_yom_lo_ba_li": return '״לא בא לי״ שלישי';
    default: return reason;
  }
}

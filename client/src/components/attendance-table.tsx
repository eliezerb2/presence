import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Edit, User, Bot, UserCheck } from "lucide-react";
import { getStatusBadgeClass } from "@/lib/status-utils";
import type { Attendance, Student } from "@shared/schema";

type AttendanceWithStudent = Attendance & { student: Student };

interface AttendanceTableProps {
  data: AttendanceWithStudent[];
  onEditRecord: (record: AttendanceWithStudent) => void;
  isLoading: boolean;
}

export default function AttendanceTable({ data, onEditRecord, isLoading }: AttendanceTableProps) {
  const getReportedByIcon = (reportedBy: string) => {
    switch (reportedBy) {
      case "student": return <User className="ml-2 h-3 w-3" />;
      case "auto": return <Bot className="ml-2 h-3 w-3" />;
      case "manager": return <UserCheck className="ml-2 h-3 w-3" />;
      default: return null;
    }
  };

  const translateReportedBy = (reportedBy: string) => {
    switch (reportedBy) {
      case "student": return "תלמיד";
      case "auto": return "אוטומטי";
      case "manager": return "מנהל";
      default: return reportedBy;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">תלמיד</TableHead>
              <TableHead className="text-right">מספר</TableHead>
              <TableHead className="text-right">רמה</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">תת-סטטוס</TableHead>
              <TableHead className="text-right">שעת כניסה</TableHead>
              <TableHead className="text-right">שעת יציאה</TableHead>
              <TableHead className="text-right">דיווח ע״י</TableHead>
              <TableHead className="text-center">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  לא נמצאו רשומות נוכחות
                </TableCell>
              </TableRow>
            ) : (
              data.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center ml-3">
                        <span className="text-primary-foreground text-sm font-medium">
                          {record.student.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`text-student-name-${record.id}`}>
                          {record.student.firstName} {record.student.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-student-nickname-${record.id}`}>
                          {record.student.nickname}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono" data-testid={`text-student-number-${record.id}`}>
                    {record.student.studentNumber}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-secondary/10 text-secondary">
                      {record.student.schoolLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(record.status)} data-testid={`status-main-${record.id}`}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(record.subStatus)} data-testid={`status-sub-${record.id}`}>
                      {record.subStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono" data-testid={`text-check-in-time-${record.id}`}>
                    {record.checkInTime || "-"}
                  </TableCell>
                  <TableCell className="font-mono" data-testid={`text-check-out-time-${record.id}`}>
                    {record.checkOutTime || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      {getReportedByIcon(record.reportedBy)}
                      <span className="text-sm" data-testid={`text-reported-by-${record.id}`}>
                        {translateReportedBy(record.reportedBy)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditRecord(record)}
                      data-testid={`button-edit-record-${record.id}`}
                    >
                      <Edit className="ml-2 h-4 w-4" />
                      עריכה
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

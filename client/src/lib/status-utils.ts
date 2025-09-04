export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "נוכח":
      return "status-present bg-success/10 text-success";
    case "יצא":
      return "status-left bg-secondary/10 text-secondary";
    case "יום לא בא לי":
      return "status-absent bg-destructive/10 text-destructive";
    case "חיסור מאושר":
      return "status-absent bg-destructive/10 text-destructive";
    case "אישור היעדרות קבוע":
      return "status-permanent-absence bg-accent/10 text-accent";
    case "לא דיווח":
      return "status-not-reported bg-muted/50 text-muted-foreground";
    case "איחור":
      return "status-late bg-warning/10 text-warning";
    case "נסגר אוטומטית":
      return "status-left bg-secondary/10 text-secondary";
    case "ללא":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function translateStatus(status: string): string {
  return status; // Since we're already using Hebrew statuses
}

export function translateSubStatus(subStatus: string): string {
  return subStatus; // Since we're already using Hebrew sub-statuses
}

export function translateReportedBy(reportedBy: string): string {
  switch (reportedBy) {
    case "student": return "תלמיד";
    case "manager": return "מנהל";
    case "auto": return "אוטומטי";
    default: return reportedBy;
  }
}

export function getStatusPriority(status: string): number {
  // Used for sorting - higher priority statuses appear first
  switch (status) {
    case "לא דיווח": return 5;
    case "איחור": return 4;
    case "יום לא בא לי": return 3;
    case "נוכח": return 2;
    case "יצא": return 1;
    case "אישור היעדרות קבוע": return 0;
    case "חיסור מאושר": return 0;
    default: return 0;
  }
}

export function isAbsentStatus(status: string): boolean {
  return ["יום לא בא לי", "חיסור מאושר", "אישור היעדרות קבוע"].includes(status);
}

export function isPresentStatus(status: string): boolean {
  return ["נוכח", "יצא"].includes(status);
}

export function isLateStatus(subStatus: string): boolean {
  return subStatus === "איחור";
}

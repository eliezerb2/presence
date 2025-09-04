import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, Lock } from "lucide-react";
import type { Attendance, Student } from "@shared/schema";

type AttendanceWithStudent = Attendance & { student: Student };

interface OverrideModalProps {
  record: AttendanceWithStudent;
  onClose: () => void;
  onSave: () => void;
}

export default function OverrideModal({ record, onClose, onSave }: OverrideModalProps) {
  const [formData, setFormData] = useState({
    status: record.status,
    subStatus: record.subStatus,
    checkInTime: record.checkInTime || "",
    checkOutTime: record.checkOutTime || "",
    reportedBy: record.reportedBy,
    closedReason: record.closedReason,
    overrideLocked: record.overrideLocked,
  });

  const { toast } = useToast();

  const overrideMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiRequest("PATCH", `/api/attendance/${record.id}/override`, updates);
    },
    onSuccess: () => {
      toast({
        title: "הנוכחות עודכנה בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון הנוכחות",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    overrideMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-override">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            עריכת נוכחות - {record.student.firstName} {record.student.lastName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">סטטוס</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger data-testid="select-override-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="לא דיווח">לא דיווח</SelectItem>
                <SelectItem value="נוכח">נוכח</SelectItem>
                <SelectItem value="יצא">יצא</SelectItem>
                <SelectItem value="יום לא בא לי">יום לא בא לי</SelectItem>
                <SelectItem value="חיסור מאושר">חיסור מאושר</SelectItem>
                <SelectItem value="אישור היעדרות קבוע">אישור היעדרות קבוע</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">תת-סטטוס</Label>
            <Select value={formData.subStatus} onValueChange={(value) => handleInputChange('subStatus', value)}>
              <SelectTrigger data-testid="select-override-sub-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ללא">ללא</SelectItem>
                <SelectItem value="איחור">איחור</SelectItem>
                <SelectItem value="נסגר אוטומטית">נסגר אוטומטית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">שעת כניסה</Label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                data-testid="input-override-check-in-time"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">שעת יציאה</Label>
              <Input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                data-testid="input-override-check-out-time"
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">דיווח על ידי</Label>
            <Select value={formData.reportedBy} onValueChange={(value) => handleInputChange('reportedBy', value)}>
              <SelectTrigger data-testid="select-override-reported-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">תלמיד</SelectItem>
                <SelectItem value="manager">מנהל</SelectItem>
                <SelectItem value="auto">אוטומטי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-reverse space-x-3 p-4 bg-warning/10 rounded-md border border-warning/20">
            <Checkbox
              id="override-lock"
              checked={formData.overrideLocked}
              onCheckedChange={(checked) => handleInputChange('overrideLocked', checked)}
              data-testid="checkbox-override-locked"
            />
            <Label htmlFor="override-lock" className="text-sm font-medium text-warning cursor-pointer">
              <Lock className="inline ml-2 h-4 w-4" />
              נעל רשומה מפני שינויים אוטומטיים
            </Label>
          </div>

          <div className="flex space-x-reverse space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-override"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={overrideMutation.isPending}
              className="flex-1"
              data-testid="button-save-override"
            >
              <Save className="ml-2 h-4 w-4" />
              שמור שינויים
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

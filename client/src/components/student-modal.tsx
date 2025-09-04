import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Student, InsertStudent } from "@shared/schema";

interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
}

export default function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [formData, setFormData] = useState<Partial<InsertStudent>>({
    firstName: "",
    lastName: "",
    nickname: "",
    studentNumber: "",
    schoolLevel: "יסודי",
    activityStatus: "פעיל",
    phoneNumber: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        nickname: student.nickname,
        studentNumber: student.studentNumber,
        schoolLevel: student.schoolLevel,
        activityStatus: student.activityStatus,
        phoneNumber: student.phoneNumber || "",
      });
    }
  }, [student]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      await apiRequest("POST", "/api/students", data);
    },
    onSuccess: () => {
      toast({
        title: "התלמיד נוסף בהצלחה",
        description: "התלמיד החדש נשמר במערכת",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהוספת התלמיד",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertStudent>) => {
      if (!student) throw new Error("No student to update");
      await apiRequest("PATCH", `/api/students/${student.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "התלמיד עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון התלמיד",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.nickname || !formData.studentNumber) {
      toast({
        title: "שגיאה בשמירה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    if (student) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData as InsertStudent);
    }
  };

  const handleInputChange = (field: keyof InsertStudent, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="modal-student">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {student ? "עריכת תלמיד" : "הוספת תלמיד חדש"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">שם פרטי</Label>
              <Input
                type="text"
                value={formData.firstName || ""}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                data-testid="input-student-first-name"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">שם משפחה</Label>
              <Input
                type="text"
                value={formData.lastName || ""}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                data-testid="input-student-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">כינוי</Label>
              <Input
                type="text"
                value={formData.nickname || ""}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                required
                data-testid="input-student-nickname"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">מספר תלמיד</Label>
              <Input
                type="text"
                value={formData.studentNumber || ""}
                onChange={(e) => handleInputChange('studentNumber', e.target.value)}
                required
                data-testid="input-student-number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">רמת בית ספר</Label>
              <Select 
                value={formData.schoolLevel || "יסודי"} 
                onValueChange={(value) => handleInputChange('schoolLevel', value)}
              >
                <SelectTrigger data-testid="select-student-school-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="יסודי">יסודי</SelectItem>
                  <SelectItem value="תיכון">תיכון</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">סטטוס פעילות</Label>
              <Select 
                value={formData.activityStatus || "פעיל"} 
                onValueChange={(value) => handleInputChange('activityStatus', value)}
              >
                <SelectTrigger data-testid="select-student-activity-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="פעיל">פעיל</SelectItem>
                  <SelectItem value="לא פעיל">לא פעיל</SelectItem>
                  <SelectItem value="מושעה">מושעה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">מספר טלפון</Label>
            <Input
              type="tel"
              value={formData.phoneNumber || ""}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="050-1234567"
              data-testid="input-student-phone"
            />
          </div>

          <div className="flex space-x-reverse space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-student"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-save-student"
            >
              <Save className="ml-2 h-4 w-4" />
              {student ? "עדכן תלמיד" : "הוסף תלמיד"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

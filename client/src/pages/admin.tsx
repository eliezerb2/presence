import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import StudentModal from "@/components/student-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, CalendarX, Umbrella, Settings, Plus, Edit, Trash2, Save } from "lucide-react";
import { getStatusBadgeClass } from "@/lib/status-utils";
import type { Student, PermanentAbsence, SchoolHoliday, Settings as SettingsType } from "@shared/schema";

type StudentWithAbsences = Student;
type PermanentAbsenceWithStudent = PermanentAbsence & { student: Student };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentLevelFilter, setStudentLevelFilter] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("");
  const [settings, setSettings] = useState<Partial<SettingsType>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch permanent absences
  const { data: permanentAbsences = [], isLoading: isLoadingAbsences } = useQuery<PermanentAbsenceWithStudent[]>({
    queryKey: ["/api/permanent-absences"],
  });

  // Fetch school holidays
  const { data: schoolHolidays = [], isLoading: isLoadingHolidays } = useQuery<SchoolHoliday[]>({
    queryKey: ["/api/school-holidays"],
  });

  // Fetch settings
  const { data: currentSettings } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // Student mutations
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      toast({ title: "התלמיד נמחק בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת התלמיד",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Permanent absence mutations
  const deletePermanentAbsenceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/permanent-absences/${id}`);
    },
    onSuccess: () => {
      toast({ title: "ההיעדרות הקבועה נמחקה בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/permanent-absences"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת ההיעדרות הקבועה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // School holiday mutations
  const deleteSchoolHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/school-holidays/${id}`);
    },
    onSuccess: () => {
      toast({ title: "החג/חופשה נמחק בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/school-holidays"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת החג/חופשה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<SettingsType>) => {
      await apiRequest("POST", "/api/settings", settingsData);
    },
    onSuccess: () => {
      toast({ title: "ההגדרות נשמרו בהצלחה" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בשמירת ההגדרות",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = !studentSearch || 
      student.firstName.includes(studentSearch) ||
      student.lastName.includes(studentSearch) ||
      student.nickname.includes(studentSearch) ||
      student.studentNumber.includes(studentSearch);
    
    const matchesLevel = !studentLevelFilter || student.schoolLevel === studentLevelFilter;
    const matchesStatus = !studentStatusFilter || student.activityStatus === studentStatusFilter;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const openAddStudentModal = () => {
    setSelectedStudent(null);
    setIsStudentModalOpen(true);
  };

  const openEditStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleSettingsChange = (field: keyof SettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const getActivityStatusBadgeClass = (status: string) => {
    switch (status) {
      case "פעיל": return "bg-success/10 text-success";
      case "לא פעיל": return "bg-muted text-muted-foreground";
      case "מושעה": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">ניהול מערכת</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students" data-testid="tab-students">
              <Users className="ml-2 h-4 w-4" />
              ניהול תלמידים
            </TabsTrigger>
            <TabsTrigger value="absences" data-testid="tab-absences">
              <CalendarX className="ml-2 h-4 w-4" />
              היעדרויות קבועות
            </TabsTrigger>
            <TabsTrigger value="holidays" data-testid="tab-holidays">
              <Umbrella className="ml-2 h-4 w-4" />
              חגים וחופשות
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="ml-2 h-4 w-4" />
              הגדרות כלליות
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">רשימת תלמידים</h3>
              <Button onClick={openAddStudentModal} data-testid="button-add-student">
                <Plus className="ml-2 h-4 w-4" />
                הוסף תלמיד חדש
              </Button>
            </div>

            {/* Student Filters */}
            <Card className="p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-reverse lg:space-x-6">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="חפש תלמיד לפי שם, כינוי או מספר..."
                    data-testid="input-filter-students"
                  />
                </div>
                <Select value={studentLevelFilter} onValueChange={setStudentLevelFilter}>
                  <SelectTrigger className="lg:w-48" data-testid="select-filter-level">
                    <SelectValue placeholder="כל הרמות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל הרמות</SelectItem>
                    <SelectItem value="יסודי">יסודי</SelectItem>
                    <SelectItem value="תיכון">תיכון</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={studentStatusFilter} onValueChange={setStudentStatusFilter}>
                  <SelectTrigger className="lg:w-48" data-testid="select-filter-status">
                    <SelectValue placeholder="כל הסטטוסים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל הסטטוסים</SelectItem>
                    <SelectItem value="פעיל">פעיל</SelectItem>
                    <SelectItem value="לא פעיל">לא פעיל</SelectItem>
                    <SelectItem value="מושעה">מושעה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Students Table */}
            <Card>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם מלא</TableHead>
                      <TableHead className="text-right">כינוי</TableHead>
                      <TableHead className="text-right">מספר תלמיד</TableHead>
                      <TableHead className="text-right">רמה</TableHead>
                      <TableHead className="text-right">סטטוס פעילות</TableHead>
                      <TableHead className="text-right">טלפון</TableHead>
                      <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStudents ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          לא נמצאו תלמידים
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center ml-3">
                                <span className="text-primary-foreground text-sm font-medium">
                                  {student.firstName.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium" data-testid={`text-student-name-${student.id}`}>
                                {student.firstName} {student.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-student-nickname-${student.id}`}>
                            {student.nickname}
                          </TableCell>
                          <TableCell className="font-mono" data-testid={`text-student-number-${student.id}`}>
                            {student.studentNumber}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-secondary/10 text-secondary">
                              {student.schoolLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActivityStatusBadgeClass(student.activityStatus)}>
                              {student.activityStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {student.phoneNumber || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-reverse space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditStudentModal(student)}
                                data-testid={`button-edit-student-${student.id}`}
                              >
                                <Edit className="ml-1 h-4 w-4" />
                                ערוך
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    data-testid={`button-delete-student-${student.id}`}
                                  >
                                    <Trash2 className="ml-1 h-4 w-4" />
                                    מחק
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>מחיקת תלמיד</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      האם אתה בטוח שברצונך למחוק את התלמיד {student.firstName} {student.lastName}?
                                      פעולה זו לא ניתנת לביטול.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteStudentMutation.mutate(student.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      מחק
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Permanent Absences Tab */}
          <TabsContent value="absences">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">אישורי היעדרות קבועים</h3>
              <Button data-testid="button-add-absence">
                <Plus className="ml-2 h-4 w-4" />
                הוסף היעדרות קבועה
              </Button>
            </div>

            <Card>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">תלמיד</TableHead>
                      <TableHead className="text-right">יום בשבוע</TableHead>
                      <TableHead className="text-right">סיבה</TableHead>
                      <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAbsences ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : permanentAbsences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          לא נמצאו היעדרויות קבועות
                        </TableCell>
                      </TableRow>
                    ) : (
                      permanentAbsences.map((absence) => (
                        <TableRow key={absence.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center ml-3">
                                <span className="text-primary-foreground text-sm font-medium">
                                  {absence.student.firstName.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium" data-testid={`text-absence-student-${absence.id}`}>
                                {absence.student.firstName} {absence.student.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-absence-weekday-${absence.id}`}>
                            {absence.weekday}
                          </TableCell>
                          <TableCell data-testid={`text-absence-reason-${absence.id}`}>
                            {absence.reason}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-reverse space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-edit-absence-${absence.id}`}
                              >
                                <Edit className="ml-1 h-4 w-4" />
                                ערוך
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    data-testid={`button-delete-absence-${absence.id}`}
                                  >
                                    <Trash2 className="ml-1 h-4 w-4" />
                                    מחק
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>מחיקת היעדרות קבועה</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      האם אתה בטוח שברצונך למחוק את ההיעדרות הקבועה?
                                      פעולה זו לא ניתנת לביטול.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePermanentAbsenceMutation.mutate(absence.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      מחק
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">חגים וחופשות</h3>
              <Button data-testid="button-add-holiday">
                <Plus className="ml-2 h-4 w-4" />
                הוסף חג/חופשה
              </Button>
            </div>

            <Card>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">תאריך</TableHead>
                      <TableHead className="text-right">תיאור</TableHead>
                      <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingHolidays ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : schoolHolidays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          לא נמצאו חגים וחופשות
                        </TableCell>
                      </TableRow>
                    ) : (
                      schoolHolidays.map((holiday) => (
                        <TableRow key={holiday.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono" data-testid={`text-holiday-date-${holiday.id}`}>
                            {holiday.date}
                          </TableCell>
                          <TableCell data-testid={`text-holiday-description-${holiday.id}`}>
                            {holiday.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-reverse space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-edit-holiday-${holiday.id}`}
                              >
                                <Edit className="ml-1 h-4 w-4" />
                                ערוך
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    data-testid={`button-delete-holiday-${holiday.id}`}
                                  >
                                    <Trash2 className="ml-1 h-4 w-4" />
                                    מחק
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>מחיקת חג/חופשה</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      האם אתה בטוח שברצונך למחוק את החג/חופשה?
                                      פעולה זו לא ניתנת לביטול.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSchoolHolidayMutation.mutate(holiday.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      מחק
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <h3 className="text-xl font-semibold text-foreground mb-6">הגדרות כלליות</h3>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">ברירות מחדל</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      מספר איחורים מותר לחודש
                    </Label>
                    <Input
                      type="number"
                      value={settings.latenessThresholdPerMonthDefault || 3}
                      onChange={(e) => handleSettingsChange('latenessThresholdPerMonthDefault', parseInt(e.target.value))}
                      data-testid="input-lateness-threshold"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      מספר ״לא בא לי״ מותר לחודש
                    </Label>
                    <Input
                      type="number"
                      value={settings.maxYomLoBaLiPerMonthDefault || 2}
                      onChange={(e) => handleSettingsChange('maxYomLoBaLiPerMonthDefault', parseInt(e.target.value))}
                      data-testid="input-yom-lo-ba-li-threshold"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">פרטי יו״ר בית המשפט</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">שם יו״ר</Label>
                    <Input
                      type="text"
                      value={settings.courtChairName || ""}
                      onChange={(e) => handleSettingsChange('courtChairName', e.target.value)}
                      placeholder="ד״ר משה לוי"
                      data-testid="input-court-chair-name"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">טלפון יו״ר</Label>
                    <Input
                      type="tel"
                      value={settings.courtChairPhone || ""}
                      onChange={(e) => handleSettingsChange('courtChairPhone', e.target.value)}
                      placeholder="050-9876543"
                      data-testid="input-court-chair-phone"
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => saveSettingsMutation.mutate(settings)}
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                <Save className="ml-2 h-4 w-4" />
                שמור הגדרות
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Modal */}
      {isStudentModalOpen && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={() => {
            setIsStudentModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/students"] });
          }}
        />
      )}
    </div>
  );
}

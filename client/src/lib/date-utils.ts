import { format } from "date-fns";
import { he } from "date-fns/locale";

export function getHebrewDate(date?: Date): string {
  const targetDate = date || new Date();
  
  try {
    return format(targetDate, "EEEE, d MMMM yyyy", { locale: he });
  } catch (error) {
    // Fallback to simple Hebrew format if locale is not available
    const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const hebrewMonths = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];
    
    const dayOfWeek = hebrewDays[targetDate.getDay()];
    const day = targetDate.getDate();
    const month = hebrewMonths[targetDate.getMonth()];
    const year = targetDate.getFullYear();
    
    return `יום ${dayOfWeek}, ${day} ב${month} ${year}`;
  }
}

export function formatTime(time: string): string {
  if (!time) return "-";
  return time;
}

export function getCurrentTime(): string {
  return format(new Date(), "HH:mm");
}

export function getCurrentDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getHebrewWeekday(date: Date): string {
  const weekdays = ["ה", "א", "ב", "ג", "ד", "ה", "א"];
  return weekdays[date.getDay()];
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday or Saturday
}

export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    return dateString;
  }
}

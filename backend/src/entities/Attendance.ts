import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Student } from './Student';

@Entity('attendance')
@Unique(['student_id', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ 
    type: 'enum', 
    enum: ['לא דיווח', 'נוכח', 'יצא', 'יום לא בא לי', 'חיסור מאושר', 'אישור היעדרות קבוע'],
    default: 'לא דיווח'
  })
  status: 'לא דיווח' | 'נוכח' | 'יצא' | 'יום לא בא לי' | 'חיסור מאושר' | 'אישור היעדרות קבוע';

  @Column({ 
    type: 'enum', 
    enum: ['ללא', 'איחור', 'נסגר אוטומטית'],
    default: 'ללא'
  })
  sub_status: 'ללא' | 'איחור' | 'נסגר אוטומטית';

  @Column({ type: 'enum', enum: ['student', 'manager', 'auto'] })
  reported_by: 'student' | 'manager' | 'auto';

  @Column({ type: 'time', nullable: true })
  check_in_time: string;

  @Column({ type: 'time', nullable: true })
  check_out_time: string;

  @Column({ 
    type: 'enum', 
    enum: ['n/a', 'manual', 'auto_16'],
    default: 'n/a'
  })
  closed_reason: 'n/a' | 'manual' | 'auto_16';

  @Column({ default: false })
  override_locked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  override_locked_at: Date;

  @ManyToOne(() => Student, student => student.attendances)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
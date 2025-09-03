import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Student } from './Student';

@Entity('permanent_absences')
@Unique(['student_id', 'weekday'])
export class PermanentAbsence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column({ type: 'enum', enum: ['א', 'ב', 'ג', 'ד', 'ה'] })
  weekday: 'א' | 'ב' | 'ג' | 'ד' | 'ה';

  @Column()
  reason: string;

  @ManyToOne(() => Student, student => student.permanent_absences)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
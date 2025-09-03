import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Student } from './Student';

@Entity('student_monthly_overrides')
@Unique(['student_id', 'year_month'])
export class StudentMonthlyOverride {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column()
  year_month: string; // YYYY-MM format

  @Column({ nullable: true })
  lateness_threshold_override: number;

  @Column({ nullable: true })
  max_yom_lo_ba_li_override: number;

  @ManyToOne(() => Student, student => student.monthly_overrides)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
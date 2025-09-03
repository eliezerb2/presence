import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './Student';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column({ type: 'date' })
  date_opened: Date;

  @Column({ type: 'enum', enum: ['late_threshold', 'third_yom_lo_ba_li', 'other'] })
  reason: 'late_threshold' | 'third_yom_lo_ba_li' | 'other';

  @Column({ type: 'json' })
  notified_to: string[]; // ['manager', 'student', 'court_chair']

  @Column({ type: 'enum', enum: ['open', 'closed'], default: 'open' })
  status: 'open' | 'closed';

  @ManyToOne(() => Student, student => student.claims)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
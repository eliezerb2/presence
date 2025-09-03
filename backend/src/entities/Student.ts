import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from 'typeorm';
import { Attendance } from './Attendance';
import { PermanentAbsence } from './PermanentAbsence';
import { StudentMonthlyOverride } from './StudentMonthlyOverride';
import { Claim } from './Claim';

@Entity('students')
@Unique(['student_number'])
@Unique(['nickname'])
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  student_number: string;

  @Column({ unique: true })
  nickname: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ type: 'enum', enum: ['יסודי', 'תיכון'] })
  school_level: 'יסודי' | 'תיכון';

  @Column({ type: 'enum', enum: ['פעיל', 'לא פעיל', 'מושעה'], default: 'פעיל' })
  activity_status: 'פעיל' | 'לא פעיל' | 'מושעה';

  @OneToMany(() => Attendance, attendance => attendance.student)
  attendances: Attendance[];

  @OneToMany(() => PermanentAbsence, absence => absence.student)
  permanent_absences: PermanentAbsence[];

  @OneToMany(() => StudentMonthlyOverride, override => override.student)
  monthly_overrides: StudentMonthlyOverride[];

  @OneToMany(() => Claim, claim => claim.student)
  claims: Claim[];
}
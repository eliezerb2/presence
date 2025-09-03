import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('school_holidays')
export class SchoolHoliday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;
}
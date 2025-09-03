import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 3 })
  lateness_threshold_per_month_default: number;

  @Column({ default: 2 })
  max_yom_lo_ba_li_per_month_default: number;

  @Column()
  court_chair_name: string;

  @Column()
  court_chair_phone: string;
}
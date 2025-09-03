import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['manager', 'auto', 'student'] })
  actor: 'manager' | 'auto' | 'student';

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column()
  entity_id: number;

  @Column({ type: 'json', nullable: true })
  before: any;

  @Column({ type: 'json', nullable: true })
  after: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
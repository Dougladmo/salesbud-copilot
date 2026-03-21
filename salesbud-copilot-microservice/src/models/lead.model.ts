import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Seller } from './seller.model.js';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  SCHEDULED = 'scheduled',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum LeadTemperature {
  COLD = 'cold',
  WARM = 'warm',
  HOT = 'hot',
}

@Entity('leads')
@Unique(['sellerId', 'remoteJid'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => Seller, (seller) => seller.leads)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @Column({ type: 'varchar', name: 'remote_jid' })
  remoteJid: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: LeadTemperature, nullable: true })
  temperature: LeadTemperature | null;

  @Column({ type: 'simple-array', nullable: true, name: 'pain_points' })
  painPoints: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  expectations: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  interests: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  objections: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  budget: string | null;

  @Column({ type: 'varchar', nullable: true })
  timeline: string | null;

  @Column({ type: 'boolean', nullable: true, name: 'is_decision_maker' })
  isDecisionMaker: boolean | null;

  @Column({ type: 'text', nullable: true, name: 'qualification_summary' })
  qualificationSummary: string | null;

  @Column({ name: 'last_contact_at', type: 'timestamp', nullable: true })
  lastContactAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

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

  @Column({ name: 'last_contact_at', type: 'timestamp', nullable: true })
  lastContactAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

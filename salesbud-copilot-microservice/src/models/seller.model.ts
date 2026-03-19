import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Company } from './company.model.js';
import { Lead } from './lead.model.js';

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.sellers)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', name: 'agent_name' })
  agentName: string;

  @Column({ type: 'varchar', name: 'pinecone_namespace', nullable: true })
  pineconeNamespace: string | null;

  @Column({ type: 'varchar', name: 'voice_id', nullable: true })
  voiceId: string | null;

  @Column({ type: 'int', name: 'max_memory_messages', default: 200 })
  maxMemoryMessages: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Lead, (lead) => lead.seller)
  leads: Lead[];
}

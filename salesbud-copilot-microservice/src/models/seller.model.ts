import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Company } from './company.model.js';
import { Lead } from './lead.model.js';

export enum TraitFormality { FORMAL = 'formal', INFORMAL = 'informal' }
export enum TraitHumor { HUMOROUS = 'humorous', SERIOUS = 'serious' }
export enum TraitCommunication { DIRECT = 'direct', DETAILED = 'detailed' }
export enum TraitEmpathy { EMPATHETIC = 'empathetic', OBJECTIVE = 'objective' }
export enum TraitSelling { CONSULTIVE = 'consultive', AGGRESSIVE = 'aggressive' }

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

  @Column({ type: 'enum', enum: TraitFormality, name: 'trait_formality', default: TraitFormality.INFORMAL })
  traitFormality: TraitFormality;

  @Column({ type: 'enum', enum: TraitHumor, name: 'trait_humor', default: TraitHumor.SERIOUS })
  traitHumor: TraitHumor;

  @Column({ type: 'enum', enum: TraitCommunication, name: 'trait_communication', default: TraitCommunication.DIRECT })
  traitCommunication: TraitCommunication;

  @Column({ type: 'enum', enum: TraitEmpathy, name: 'trait_empathy', default: TraitEmpathy.EMPATHETIC })
  traitEmpathy: TraitEmpathy;

  @Column({ type: 'enum', enum: TraitSelling, name: 'trait_selling', default: TraitSelling.CONSULTIVE })
  traitSelling: TraitSelling;

  @Column({ name: 'custom_prompt', type: 'text', nullable: true })
  customPrompt: string | null;

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

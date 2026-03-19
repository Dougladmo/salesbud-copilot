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

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.sellers)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  name: string;

  @Column({ name: 'agent_name' })
  agentName: string;

  @Column({ name: 'evolution_instance' })
  evolutionInstance: string;

  @Column({ name: 'pinecone_namespace', nullable: true })
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

  @Column({ name: 'voice_id', nullable: true })
  voiceId: string | null;

  @Column({ name: 'timeout_ms', default: 5000 })
  timeoutMs: number;

  @Column({ name: 'time_per_char_ms', default: 50 })
  timePerCharMs: number;

  @Column({ name: 'max_memory_messages', default: 7 })
  maxMemoryMessages: number;

  @Column({ name: 'audio_threshold', default: 500 })
  audioThreshold: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Lead, (lead) => lead.seller)
  leads: Lead[];
}

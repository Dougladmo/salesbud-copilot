import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Seller } from './seller.model.js';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'pinecone_namespace' })
  pineconeNamespace: string;

  @Column({ name: 'evolution_api_url' })
  evolutionApiUrl: string;

  @Column({ name: 'evolution_api_key' })
  evolutionApiKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Seller, (seller) => seller.company)
  sellers: Seller[];
}

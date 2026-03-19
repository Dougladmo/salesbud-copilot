export interface Company {
  id: string;
  name: string;
  pineconeNamespace: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  pineconeNamespace: string;
}

export type TraitFormality = 'formal' | 'informal';
export type TraitHumor = 'humorous' | 'serious';
export type TraitCommunication = 'direct' | 'detailed';
export type TraitEmpathy = 'empathetic' | 'objective';
export type TraitSelling = 'consultive' | 'aggressive';

export interface Seller {
  id: string;
  companyId: string;
  company?: Company;
  name: string;
  agentName: string;
  pineconeNamespace: string | null;
  traitFormality: TraitFormality;
  traitHumor: TraitHumor;
  traitCommunication: TraitCommunication;
  traitEmpathy: TraitEmpathy;
  traitSelling: TraitSelling;
  customPrompt: string | null;
  voiceId: string | null;
  maxMemoryMessages: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerDto {
  companyId: string;
  name: string;
  agentName: string;
  pineconeNamespace?: string;
  traitFormality?: TraitFormality;
  traitHumor?: TraitHumor;
  traitCommunication?: TraitCommunication;
  traitEmpathy?: TraitEmpathy;
  traitSelling?: TraitSelling;
  customPrompt?: string;
  voiceId?: string;
  maxMemoryMessages?: number;
  isActive?: boolean;
}

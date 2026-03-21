export interface Company {
  id: string;
  name: string;
  pineconeNamespace: string;
  createdAt: string;
  updatedAt: string;
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
  evolutionInstanceName: string | null;
  maxMemoryMessages: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'scheduled' | 'converted' | 'lost';
export type LeadTemperature = 'cold' | 'warm' | 'hot';

export interface Lead {
  id: string;
  sellerId: string;
  remoteJid: string;
  name: string | null;
  phone: string;
  status: LeadStatus;
  temperature: LeadTemperature | null;
  notes: string | null;
  painPoints: string[] | null;
  expectations: string[] | null;
  interests: string[] | null;
  objections: string[] | null;
  budget: string | null;
  timeline: string | null;
  isDecisionMaker: boolean | null;
  qualificationSummary: string | null;
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
}

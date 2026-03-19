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

export interface Seller {
  id: string;
  companyId: string;
  company?: Company;
  name: string;
  agentName: string;
  pineconeNamespace: string | null;
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
  voiceId?: string;
  maxMemoryMessages?: number;
  isActive?: boolean;
}

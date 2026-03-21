import 'reflect-metadata';
import { container } from 'tsyringe';
import { CompanyService } from './services/company.service.js';
import { SellerService } from './services/seller.service.js';
import { LeadService } from './services/lead.service.js';
import { RagService } from './services/rag.service.js';
import { AgentService } from './services/agent.service.js';
import { MessageBufferService } from './services/message-buffer.service.js';
import { TranscriptionService } from './services/transcription.service.js';
import { WhatsappService } from './services/whatsapp.service.js';
import { CalendarService } from './services/calendar.service.js';

container.registerSingleton(CompanyService);
container.registerSingleton(SellerService);
container.registerSingleton(LeadService);
container.registerSingleton(RagService);
container.registerSingleton(AgentService);
container.registerSingleton(MessageBufferService);
container.registerSingleton(TranscriptionService);
container.registerSingleton(WhatsappService);
container.registerSingleton(CalendarService);

export { container };

import { injectable } from 'tsyringe';
import { AppDataSource } from '../config/database.js';
import { Company } from '../models/company.model.js';
import { NotFoundError } from '../utils/app-error.js';
import type { CreateCompanyInput, UpdateCompanyInput } from '../validations/company.validation.js';

@injectable()
export class CompanyService {
  private readonly repo = AppDataSource.getRepository(Company);

  create(data: CreateCompanyInput): Promise<Company> {
    const company = this.repo.create(data);
    return this.repo.save(company);
  }

  findAll(): Promise<Company[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.repo.findOne({ where: { id } });
    if (!company) throw new NotFoundError(`Company ${id} not found`);
    return company;
  }

  async update(id: string, data: UpdateCompanyInput): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, data);
    return this.repo.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    await this.repo.remove(company);
  }
}

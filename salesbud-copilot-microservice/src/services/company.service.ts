import { injectable } from 'tsyringe';
import { AppDataSource } from '../config/database.js';
import { Company } from '../models/company.model.js';
import { NotFoundError } from '../utils/app-error.js';

@injectable()
export class CompanyService {
  private readonly repo = AppDataSource.getRepository(Company);

  findAll(): Promise<Company[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.repo.findOne({ where: { id } });
    if (!company) throw new NotFoundError(`Company ${id} not found`);
    return company;
  }
}

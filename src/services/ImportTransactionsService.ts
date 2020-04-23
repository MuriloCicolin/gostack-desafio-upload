import { getRepository } from 'typeorm';
import { join } from 'path';
import { promises } from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import upload from '../config/upload';

interface Format {
  title: string;
  type: string;
  value: number;
  category: string;
}

class ImportTransactionsService {
  public async execute({
    fileName,
  }: {
    fileName: string;
  }): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);

    const filePath = join(upload.directory, fileName);

    const contentFile = await promises.readFile(filePath, {
      encoding: 'utf-8',
    });

    const [, ...lines] = contentFile.split('\n').map(item => item.split(','));

    const format = this.formatDataFilter(lines);

    const createsTransactions = await this.createsTransactions(format);

    await transactionsRepository.save(createsTransactions);

    await promises.unlink(filePath);

    return createsTransactions;
  }

  private formatDataFilter(items: string[][]): Format[] {
    return items
      .map(item => {
        const [title, type, value, category] = item;
        return {
          title,
          type,
          value: Number(value),
          category,
        };
      })
      .filter(item => item.title.length);
  }

  private async createsTransactions(items: Format[]): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);

    const multPromises = items.map(async item => {
      const type = item.type.trim() === 'income' ? 'income' : 'outcome';
      const category_id = await this.verifyCategory(item.category);

      return transactionsRepository.create({
        title: item.title.trim(),
        type,
        value: item.value,
        category_id,
      });
    });

    const result = await Promise.all(multPromises);
    return result;
  }

  private async verifyCategory(title: string): Promise<string> {
    const categotiesRepository = getRepository(Category);
    const formatTitle = title.trim();

    const categoryDB = await categotiesRepository.findOne({
      where: { title: formatTitle },
    });

    if (!categoryDB) {
      const newCategory = categotiesRepository.create({
        title: formatTitle,
      });
      const { id } = await categotiesRepository.save(newCategory);
      return id;
    }

    return categoryDB.id;
  }
}

export default ImportTransactionsService;

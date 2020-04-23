// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    let category_id: string;

    if (type === 'outcome') {
      const { income } = await transactionRepository.getBalance();
      if (income < value) {
        throw new AppError('Unable to continue registration', 400);
      }
    }

    const categoryExist = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryExist) {
      const newCategory = categoryRepository.create({
        title: category,
      });
      category_id = (await categoryRepository.save(newCategory)).id;
    } else {
      category_id = categoryExist.id;
    }

    const transaction = transactionRepository.create({
      category_id,
      title,
      value,
      type,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;

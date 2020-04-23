import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = transactions
      .filter(item => item.type === 'income')
      .reduce((acc, atual) => {
        return acc + Number(atual.value);
      }, 0);

    const outcome = transactions
      .filter(item => item.type === 'outcome')
      .reduce((acc, atual) => {
        return acc + Number(atual.value);
      }, 0);

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;

import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute({ id }: { id: string }): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    await transactionsRepository.findOne(id);

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;

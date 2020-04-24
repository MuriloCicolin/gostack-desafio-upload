import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse'; // Lib para manipular o arquivo CSV
import fs from 'fs'; // fileSystem, ajudar abrir e ler o arquivo

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);
    // contactsReadStream é  stream que vai ta lendo nnosso arquivo
    // fs.createReadStream(filePath) => ler o nosso path

    const parcers = csvParse({
      // parcers tá pegando metodos do csvParse
      from_line: 2, // pegando a informação do cvs, apartir da linha 2
    });

    // pipe => transmite a informação de uma stream pra outra
    const parseCSV = contactsReadStream.pipe(parcers);

    // um array de sring
    const transactions: Request[] = [];
    const categories: string[] = [];

    // cada linha, estamos desestruturando e mapeando
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      // se esses 3 não tiverem, não podemos deixar ser concluido
      if (!title || !type || !value) return;

      categories.push(category);
      // essa transaction vai conter todas as informações
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalcategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalcategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;

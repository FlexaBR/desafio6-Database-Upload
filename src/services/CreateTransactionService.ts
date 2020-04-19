import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
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
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    // if (type !== 'income') {
    //  if (type !== 'outcome') {
    //    throw new AppError('This type is <> income or outcome!');
    //  }
    // }

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid.');
    }

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Account balance cannot be negative!', 400);
    }

    const categoriesRepository = getRepository(Category);

    let categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      categoryExists = categoriesRepository.create({ title: category });
      await categoriesRepository.save(categoryExists);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryExists,
    });

    await transactionsRepository.save(transaction);

    delete transaction.category_id;
    delete transaction.created_at;
    delete transaction.updated_at;
    delete transaction.category.id;
    delete transaction.category.created_at;
    delete transaction.category.updated_at;

    return transaction;
  }
}

export default CreateTransactionService;

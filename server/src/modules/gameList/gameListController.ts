import { Request, Response } from 'express';
import { processInitialSync } from './gameListService';

export const syncInitialGameList = async (req: Request, res: Response) => {
  try {
    console.log('Starting initial game list sync...');
    const result = await processInitialSync();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to sync game list',
    });
  }
};

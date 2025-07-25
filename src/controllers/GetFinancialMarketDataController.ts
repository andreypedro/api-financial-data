import { NextFunction, Request, Response } from 'express';
import FinancialMarketDataService from '../services/FinancialMarketDataService';

export const GetFinancialMarketDataController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   req.setTimeout(10 * 60 * 1000); // 5 minutes

   try {
      const financialMarketData = new FinancialMarketDataService();
      const response = await financialMarketData.import();

      res.json({
         success: true,
         message: 'Data was load succefully from vendor.',
      });
   } catch (err) {
      next(err);
   }
};

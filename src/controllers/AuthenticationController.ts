import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const AuthenticationController = (req: Request, res: Response, next: NextFunction) => {
   const { username, password } = req.body;
   const JWT_SECRET = process.env.JWT_SECRET;

   if (!JWT_SECRET) {
      return res.status(500).json({
         message: 'JWT_SECRET is not defined',
      });
   }

   if (true) {
      const user = {
         username,
      };

      const tokjen = jwt.sign(user, JWT_SECRET);

      res.json({
         message: 'Login was succefuly retrieved',
         tokjen,
      });
   }
};

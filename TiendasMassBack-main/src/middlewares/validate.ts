import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ApiError } from './errorHandler';

export const validate = (schema: ZodTypeAny) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatear los errores de Zod
        const zodError = error as any;
        const errorMessages = zodError.errors.map((issue: any) => ({
            message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        
        res.status(400).json({
          status: 'error',
          message: 'Invalid data',
          details: errorMessages,
        });
        return;
      }
      next(new ApiError('Error de validación interna', 500));
    }
  };

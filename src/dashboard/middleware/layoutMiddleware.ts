// src/middleware/layoutMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { generateLayoutHtml } from '../views/layout';

export function layoutMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Sobrescribir el método res.send para envolver el contenido
    const originalSend = res.send.bind(res);
    
    res.send = (body: any): Response => {
        if (!req.xhr) {
            body = generateLayoutHtml(body);
        }
        return originalSend(body);
    };
    
    next();
}

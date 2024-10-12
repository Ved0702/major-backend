import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    userId?: number; // Use 'number' instead of 'Number'
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = req.header('x-auth-token');

    if (!token) {
        res.status(401).json({ message: 'No token, authorization denied' });
        return;
    }

    try {

        const jwtSecret = process.env.JWT_SECRET_KEY || "secret";
        console.log(jwtSecret);

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        console.log(decoded);
        req.userId = decoded.id; // Store the user ID in the request object
        next();
    } catch (err:any) {
        res.status(400).json({ message: `Token is not valid ${err.message}`  });
    }
};

export default authMiddleware;

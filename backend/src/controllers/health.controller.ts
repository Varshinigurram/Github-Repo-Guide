import { Request, Response } from 'express';

/**
 * Health check controller.
 * Responds with a simple status object to confirm the backend server is operational.
 */
export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'github-repo-guide'
  });
};

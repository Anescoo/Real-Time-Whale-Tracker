import { Router, Request, Response } from 'express';
import { EthereumService } from '../services/ethereum.service';

export const createApiRoutes = (ethService: EthereumService) => {
  const router = Router();

  // 🐋 GET /api/whales
  router.get('/whales', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = ethService.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error('❌ Error fetching whales:', error);
      res.status(500).json({ error: 'Failed to fetch whales' });
    }
  });

  // 📊 GET /api/stats
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const stats = ethService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  return router;
};

import { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysis.service.js';

export class AnalysisController {
  public static async getAnalysisJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { analysisId } = req.params;
      const job = await AnalysisService.getAnalysisJob(analysisId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Analysis job ${analysisId} not found` },
        });
        return;
      }

      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  public static async getAnalysisGraph(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { analysisId } = req.params;
      const graph = await AnalysisService.getGraphData(analysisId);
      res.json({ success: true, data: graph });
    } catch (err) {
      next(err);
    }
  }

  public static async getAnalysisFindings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { analysisId } = req.params;
      const severity = req.query.severity as string | undefined;
      const findings = await AnalysisService.getFindings(analysisId, severity);
      res.json({ success: true, data: findings });
    } catch (err) {
      next(err);
    }
  }

  public static async getAnalysisReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { analysisId } = req.params;
      const report = await AnalysisService.getReport(analysisId);
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
}

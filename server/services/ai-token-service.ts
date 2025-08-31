import { demoService } from "./demo-service";

export class AITokenService {
  // Estimate tokens for a request (rough estimation)
  static estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Check if user can make AI request
  static async canMakeRequest(userId: string, promptText: string): Promise<{ canMake: boolean; reason?: string }> {
    const estimatedTokens = this.estimateTokens(promptText);
    const result = await demoService.canUseTokens(userId, estimatedTokens);
    return { canMake: result.canUse, reason: result.reason };
  }

  // Track actual token usage after AI request
  static async trackUsage(userId: string, actualTokens: number): Promise<void> {
    await demoService.trackTokenUsage(userId, actualTokens);
  }

  // Get usage stats for user
  static async getUsageStats(userId: string): Promise<{
    isDemoUser: boolean;
    tokensUsed?: number;
    tokenLimit?: number;
    tokensRemaining?: number;
    percentageUsed?: number;
  }> {
    const status = await demoService.getDemoStatus(userId);
    
    if (!status.isDemoUser) {
      return { isDemoUser: false };
    }

    const percentageUsed = status.tokenLimit 
      ? Math.round((status.tokensUsed! / status.tokenLimit) * 100)
      : 0;

    return {
      isDemoUser: true,
      tokensUsed: status.tokensUsed,
      tokenLimit: status.tokenLimit,
      tokensRemaining: status.tokensRemaining,
      percentageUsed,
    };
  }
}
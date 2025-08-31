import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { db } from "../db";
import { chatMessages, users } from "@shared/schema";
import { eq, desc, gte, sql, and } from "drizzle-orm";

export function registerAnalyticsRoutes(app: Express) {
  // Real-time advisor usage analytics
  app.get("/api/analytics/advisor-usage", isAuthenticated, async (req, res) => {
    try {
      // Get date ranges for weekly analysis
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      // Get all chat messages with user data
      const chatData = await db
        .select({
          agentType: chatMessages.agentType,
          userId: chatMessages.userId,
          timestamp: chatMessages.timestamp,
          content: chatMessages.content,
          country: users.country,
          businessStructure: users.businessStructure,
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.userId, users.id))
        .where(gte(chatMessages.timestamp, twoWeeksAgo))
        .orderBy(desc(chatMessages.timestamp));

      // Calculate advisor statistics
      const advisorStats = [
        { agent: "Accountant", icon: "💸", key: "accountant" },
        { agent: "Marketing", icon: "📣", key: "marketing" },
        { agent: "Business Coach", icon: "🎯", key: "coach" },
        { agent: "Legal", icon: "📜", key: "legal" },
      ].map((advisor) => {
        const advisorChats = chatData.filter(chat => chat.agentType === advisor.key);
        const thisWeekChats = advisorChats.filter(chat => 
          chat.timestamp && new Date(chat.timestamp) >= oneWeekAgo
        );
        const lastWeekChats = advisorChats.filter(chat => 
          chat.timestamp && new Date(chat.timestamp) >= twoWeeksAgo && new Date(chat.timestamp) < oneWeekAgo
        );

        // Calculate regional breakdown
        const auUsers = new Set(advisorChats.filter(chat => chat.country === "Australia").map(c => c.userId)).size;
        const nzUsers = new Set(advisorChats.filter(chat => chat.country === "New Zealand").map(c => c.userId)).size;

        // Calculate user type breakdown
        const soloUsers = new Set(advisorChats.filter(chat => 
          chat.businessStructure === "solo" || !chat.businessStructure
        ).map(c => c.userId)).size;
        const teamUsers = new Set(advisorChats.filter(chat => 
          chat.businessStructure === "team" || chat.businessStructure === "family"
        ).map(c => c.userId)).size;

        // Calculate average messages per conversation
        const uniqueUsers = new Set(advisorChats.map(c => c.userId));
        const averageMessages = uniqueUsers.size > 0 
          ? Math.round(advisorChats.length / uniqueUsers.size)
          : 0;

        // Extract popular topics (simplified - look for common keywords)
        const allMessages = advisorChats.map(c => c.content?.toLowerCase() || "");
        const topicKeywords = {
          "accountant": ["gst", "tax", "invoice", "expense", "ato", "ird", "bas"],
          "marketing": ["customers", "ads", "social", "website", "reviews"],
          "coach": ["goals", "growth", "scale", "hire", "planning"],
          "legal": ["contract", "insurance", "liability", "employee", "workcover", "acc"]
        };
        
        const relevantKeywords = topicKeywords[advisor.key as keyof typeof topicKeywords] || [];
        const popularTopics = relevantKeywords
          .map(keyword => ({
            keyword,
            count: allMessages.filter(msg => msg.includes(keyword)).length
          }))
          .filter(item => item.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map(item => item.keyword);

        return {
          agent: advisor.agent,
          icon: advisor.icon,
          totalChats: advisorChats.length,
          thisWeek: thisWeekChats.length,
          lastWeek: lastWeekChats.length,
          auUsers,
          nzUsers,
          soloUsers,
          teamUsers,
          averageMessages,
          popularTopics
        };
      });

      // Calculate overall metrics
      const totalEngagement = chatData.length;
      const regionBreakdown = {
        au: new Set(chatData.filter(chat => chat.country === "Australia").map(c => c.userId)).size,
        nz: new Set(chatData.filter(chat => chat.country === "New Zealand").map(c => c.userId)).size
      };

      const userTypeBreakdown = {
        solo: new Set(chatData.filter(chat => 
          chat.businessStructure === "solo" || !chat.businessStructure
        ).map(c => c.userId)).size,
        team: new Set(chatData.filter(chat => 
          chat.businessStructure === "team" || chat.businessStructure === "family"
        ).map(c => c.userId)).size
      };

      // Generate weekly trends (last 4 weeks)
      const weeklyTrends = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        
        const weekChats = chatData.filter(chat => 
          chat.timestamp && new Date(chat.timestamp) >= weekStart && new Date(chat.timestamp) < weekEnd
        );

        weeklyTrends.push({
          week: `Week ${4 - i}`,
          engagement: weekChats.length
        });
      }

      // Find top growing agent
      const topGrowthAgent = advisorStats
        .filter(advisor => advisor.lastWeek > 0)
        .sort((a, b) => {
          const aGrowth = (a.thisWeek - a.lastWeek) / a.lastWeek;
          const bGrowth = (b.thisWeek - b.lastWeek) / b.lastWeek;
          return bGrowth - aGrowth;
        })[0]?.agent || advisorStats.sort((a, b) => b.thisWeek - a.thisWeek)[0]?.agent || "Business Coach";

      const analytics = {
        advisorStats,
        totalEngagement,
        regionBreakdown,
        userTypeBreakdown,
        weeklyTrends,
        topGrowthAgent
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching advisor analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Additional analytics endpoints for migration tracking
  app.get("/api/analytics/migration-sources", isAuthenticated, async (req, res) => {
    try {
      // This would track where users are migrating from
      // For now, return sample data structure
      const migrationData = {
        serviceM8: { users: 12, avgJobs: 45, avgInvoices: 67 },
        tradify: { users: 8, avgJobs: 32, avgInvoices: 48 },
        manual: { users: 34, avgJobs: 0, avgInvoices: 0 },
        other: { users: 6, avgJobs: 15, avgInvoices: 23 }
      };

      res.json(migrationData);
    } catch (error) {
      console.error("Error fetching migration analytics:", error);
      res.status(500).json({ error: "Failed to fetch migration data" });
    }
  });
}
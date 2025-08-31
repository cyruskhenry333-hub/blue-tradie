import { db } from "../db";
import { betaCodes } from "@shared/betaCodeSchema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export class BetaCodeManager {
  // Generate a new beta code (BT-2025-001 format)
  static async generateCode(description: string, adminUserId: string, maxUses: number = 1, expiresAt?: Date) {
    // Get the next sequence number for this year
    const year = new Date().getFullYear();
    const yearPrefix = `BT-${year}-`;
    
    const lastCode = await db
      .select()
      .from(betaCodes)
      .where(sql`code LIKE ${yearPrefix + '%'}`)
      .orderBy(sql`code DESC`)
      .limit(1);

    let nextNum = 1;
    if (lastCode.length > 0) {
      const match = lastCode[0].code.match(/BT-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }

    const newCode = `${yearPrefix}${nextNum.toString().padStart(3, '0')}`;

    const [createdCode] = await db
      .insert(betaCodes)
      .values({
        code: newCode,
        description,
        createdBy: adminUserId,
        maxUses,
        expiresAt
      })
      .returning();

    return createdCode;
  }

  // Validate and use a beta code
  static async validateAndUseCode(code: string, userId: string) {
    const betaCode = await db
      .select()
      .from(betaCodes)
      .where(eq(betaCodes.code, code.toUpperCase()))
      .limit(1);

    if (!betaCode.length) {
      return { valid: false, message: "Invalid invite code" };
    }

    const codeData = betaCode[0];

    // Check if code is active
    if (!codeData.isActive) {
      return { valid: false, message: "This invite code has been deactivated" };
    }

    // Check if code has expired
    if (codeData.expiresAt && new Date() > codeData.expiresAt) {
      return { valid: false, message: "This invite code has expired" };
    }

    // Check if code has reached max uses
    if (codeData.currentUses >= codeData.maxUses) {
      return { valid: false, message: "This invite code has already been used" };
    }

    // Use the code - increment usage counter
    await db
      .update(betaCodes)
      .set({ 
        currentUses: codeData.currentUses + 1,
        usedBy: userId,
        usedAt: new Date()
      })
      .where(eq(betaCodes.id, codeData.id));

    return { 
      valid: true, 
      code: codeData,
      message: "Valid invite code"
    };
  }

  // Get all codes for admin dashboard
  static async getAllCodes() {
    return await db
      .select()
      .from(betaCodes)
      .orderBy(sql`created_at DESC`);
  }

  // Revoke a code
  static async revokeCode(codeId: number, adminUserId: string) {
    await db
      .update(betaCodes)
      .set({ isActive: false })
      .where(eq(betaCodes.id, codeId));
  }

  // Legacy support for old "BETA*" pattern during transition
  static isLegacyBetaCode(code: string): boolean {
    return code.toUpperCase().startsWith('BETA') && code.length <= 10;
  }
}
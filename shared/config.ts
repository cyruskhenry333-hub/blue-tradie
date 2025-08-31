// Blue Tradie Configuration
// Centralized settings for features, promotions, and environment-specific configurations

export const config = {
  // Marketing & Promotions
  features: {
    // Lifetime Access Offer - Toggle for beta/launch periods
    lifetimeAccessOffer: {
      enabled: true, // Set to false to hide the offer
      title: "🎯 Early Access Special",
      subtitle: "Get lifetime access to Phase 1 features",
      ctaText: "What's included? • Terms apply"
    },



    // Future feature flags
    voiceFeatures: false,
    teamCollaboration: false,
    advancedIntegrations: false
  },

  // Business configuration
  business: {
    supportEmail: "support@bluetradie.com",
    salesEmail: "sales@bluetradie.com",
    companyName: "Blue Tradie",
    currentYear: 2025
  },

  // Product tier definitions - Pricing includes AI costs + profit margin
  productTiers: {
    bluelite: {
      name: "⚡ Blue Lite",
      monthlyPrice: 29.99, // $10 AI costs + $19.99 profit/platform costs
      description: "AI-powered guidance for solo tradies starting out",
      jobLimit: 10,
      aiTokensIncluded: 1000, // Monthly AI token allocation (cost ~$10)
      actualAiCost: 10.00, // Real OpenAI cost for 1000 tokens/month
      profitMargin: 19.99, // Platform profit + hosting costs
      aiType: "advisors", // AI Advisors (guidance only, no automation)
      aiAssistants: ["Business Coach", "Marketing Specialist", "Accountant", "Legal"],
      features: [
        "Up to 10 jobs/month",
        "1,000 AI tokens/month (30-40 advisor conversations)",
        "Invoicing, quoting & expense tracking", 
        "AU/NZ tax compliance (GST calculations)",
        "4 AI Advisors: Business Coach, Marketing, Accountant, Legal",
        "Blue Tradie Directory listing",
        "Vision board & goal setting",
        "PWA mobile access (basic)",
        "Token usage dashboard & alerts"
      ],
      valueProposition: "Expert AI guidance with predictable monthly costs"
    },
    bluecore: {
      name: "🔷 Blue Core", 
      monthlyPrice: 69.99, // $20 AI costs + $49.99 profit/platform costs
      description: "AI automation agents for solo tradies ready to scale",
      jobLimit: "unlimited",
      aiTokensIncluded: 2000, // Higher token allocation for automation (cost ~$20)
      actualAiCost: 20.00, // Real OpenAI cost for 2000 tokens/month
      profitMargin: 49.99, // Platform profit + hosting costs
      aiType: "automation", // AI Automation Agents (can take actions)
      aiAssistants: ["AI Branding Wizard"], // Only branding automation
      keyUpgrades: [
        "Unlimited jobs + job scheduling (calendar sync + reminders)",
        "2,000 AI tokens/month (mix of automation + conversations)",
        "AI Automation Agents (invoice/quote generation, scheduling)",
        "AI Branding Wizard (logo creation, brand guidelines)",
        "Voice input & transcription tools",
        "Advanced reporting & analytics",
        "Smart token optimization suggestions"
      ],
      includes: ["Everything in Blue Lite", "Priority support", "Blue Tradie Directory listing"]
    },
    blueteams: {
      name: "👥 Blue Teams",
      monthlyPrice: 119.99, // $40 AI costs + $79.99 profit/platform costs
      description: "Complete team management solution for growing trade businesses",
      jobLimit: "unlimited",
      aiTokensIncluded: 4000, // Highest token allocation for teams (cost ~$40)
      actualAiCost: 40.00, // Real OpenAI cost for 4000 tokens/month
      profitMargin: 79.99, // Platform profit + hosting costs
      aiType: "automation", // Full AI automation suite
      aiAssistants: ["AI Branding Wizard", "Team Coordinator AI"],
      keyUpgrades: [
        "Team collaboration & role permissions (up to 10 team members)",
        "4,000 AI tokens/month (shared pool with team usage analytics)",
        "Team scheduling & dispatch management", 
        "Multi-user job assignments & tracking",
        "Team performance analytics powered by AI",
        "Advanced tax prep & vendor management",
        "White-label options for established businesses",
        "Team token allocation & usage monitoring"
      ],
      includes: ["Everything in Blue Core", "Blue Tradie Directory listing", "Dedicated account manager"]
    }
  },

  // Demo Strategy - Restricted to First 100 VIP Waitlist Members Only
  demoStrategy: {
    maxDemoUsers: 100, // Limited to First 100 VIP waitlist members only
    demoTokenLimit: 1000000, // 1M tokens for full 14-day trial experience
    demoTokenCost: 0, // Free for users (host covers $1.82 cost)
    paymentRequired: false, // No payment needed
    hostCoversAiCost: 1.82, // Host pays ~$1.82 per demo for AI costs (AU$)
    restrictedToVipWaitlist: true, // NEW: Demo access restricted to First 100 only
    manualEarlyAccessApproval: true, // Allow manual early access for VIP members
    educationalMessaging: {
      title: "Free AI Trial - 1,000,000 Tokens Included",
      explanation: "We're giving you 1,000,000 free AI tokens to experience unlimited conversations with your AI business team over 14 days.",
      costEducation: {
        tokenValue: "Each token costs approximately 1¢ in AI processing",
        conversationCost: "A typical conversation uses 25-30 tokens (25-30¢)",
        exampleConversations: [
          {
            type: "Quick question",
            example: "What's the GST rate for plumbing services?",
            tokens: 15,
            cost: "15¢"
          },
          {
            type: "Invoice advice", 
            example: "Should I charge GST on this job? Here's the details...",
            tokens: 25,
            cost: "25¢"
          },
          {
            type: "Business planning",
            example: "Help me plan my marketing strategy for next quarter",
            tokens: 80,
            cost: "80¢"
          }
        ]
      },
      usageGuidance: "Your 1,000,000 free tokens = hundreds of meaningful conversations with your AI business team. Explore everything!",
      overagePolicy: "With 1 million tokens included, you'll have full access to test all features during your 14-day trial."
    },
    demoAllowedFeatures: [
      "Full job management suite",
      "Complete invoicing system", 
      "Expense tracking with AI categorization",
      "Dashboard and analytics",
      "AI advisor conversations (1,000,000 free tokens)",
      "Full AI automation access during trial"
    ],
    costProtection: {
      enabled: true,
      maxCostPerDemo: 2.50, // Maximum $2.50 AI cost per demo (includes buffer)
      alertThreshold: 1.50, // Alert when demo reaches $1.50
      autoSuspendAt: 2.50, // Auto-suspend demo at $2.50
      educationalAlerts: true, // Show educational messages about token usage
      overageCharging: true // Charge user for tokens beyond limit
    }
  },

  // AI Token Economy
  tokenEconomy: {
    // Token pricing for additional purchases (includes AI cost + markup)
    tokenPackages: {
      small: {
        tokens: 200,
        price: 4.99, // $1 AI cost + $3.99 markup
        actualCost: 1.00,
        markup: 3.99,
        description: "4-6 additional conversations"
      },
      medium: {
        tokens: 500,
        price: 9.99, // $2.50 AI cost + $7.49 markup  
        actualCost: 2.50,
        markup: 7.49,
        description: "10-15 additional conversations"
      },
      large: {
        tokens: 1000,
        price: 17.99, // $5 AI cost + $12.99 markup
        actualCost: 5.00,
        markup: 12.99,
        description: "20-30 additional conversations"
      }
    },
    
    // Ways to earn free tokens
    earnTokens: {
      referralBonus: 200, // Tokens per successful referral
      socialMediaPost: 50, // Share platform screenshot
      writtenTestimonial: 100, // Short review
      caseStudyParticipation: 500, // 15-minute interview
      monthlyLoyalty: 100 // Bonus for consecutive months
    },

    // Token usage estimates - ALL AI interactions consume tokens
    usageEstimates: {
      // Conversational AI (Blue Lite - Advisors)
      quickQuestion: 15, // "What's the GST rate for this?"
      invoiceAdvice: 25, // "Should I charge GST on this job?"
      businessPlanningChat: 80, // "Help me plan my marketing strategy"
      fullConsultation: 120, // Complete business planning session
      
      // AI Automation Tasks (Blue Core & Teams)
      autoInvoiceGeneration: 45, // AI creates invoice from job notes
      autoQuoteGeneration: 40, // AI generates quote from description
      autoExpenseCategorization: 20, // AI categorizes expense entries (batch of 10)
      autoJobScheduling: 30, // AI optimizes daily schedule
      autoCustomerFollowUp: 35, // AI drafts follow-up messages
      autoReportGeneration: 60, // AI creates weekly/monthly reports
      
      // AI Branding Wizard (Blue Core & Teams)
      logoGeneration: 150, // AI creates business logo
      brandGuidelineCreation: 100, // AI develops brand colors/fonts
      marketingCopyGeneration: 75, // AI writes marketing materials
      socialMediaPostCreation: 40, // AI creates social media content
      
      // Team Coordination AI (Blue Teams only)
      teamScheduleOptimization: 80, // AI coordinates team schedules
      jobAssignmentRecommendations: 50, // AI suggests best team member for job
      teamPerformanceAnalysis: 90, // AI analyzes team productivity
      
      // Voice-to-Text Processing (Blue Core & Teams)
      voiceTranscription: 10, // Per minute of voice input
      voiceCommandProcessing: 20, // AI processes voice commands
      
      // Smart Document Processing
      receiptProcessing: 25, // AI extracts data from receipt photos
      contractAnalysis: 120, // AI reviews contract terms
      taxDocumentPrep: 100 // AI assists with BAS/tax forms
    }
  },

  // Legacy phase definitions for backward compatibility
  phases: {
    phase1: {
      name: "Phase 1 - Core Business Management", 
      features: [
        "Smart invoicing & quote generation",
        "4 AI business agents (Accountant, Legal, Marketing, Business Coach)",
        "Job & customer management", 
        "Expense tracking & GST calculations",
        "AU/NZ regional compliance (ATO/IRD)",
        "Mobile-optimized interface"
      ]
    },
    phase2Plus: {
      name: "Phase 2+ - Advanced Features",
      features: [
        "AI branding & logo generation",
        "Team collaboration features",
        "Advanced bank integrations", 
        "Voice-to-text features",
        "Global market expansion tools"
      ]
    }
  },

  // VIP Waitlist Configuration (First 100 Users)
  waitlistStrategy: {
    vipWaitlistLimit: 100, // First 100 get VIP benefits
    vipBenefits: {
      discount: 30, // 30% off Blue Lite first year (stackable with referrals)
      tokensIncluded: 1000000, // 1M demo tokens
      priorityAccess: true,
      canApplyDiscountDuringDemo: true // Allow discount redemption during demo
    }
  },

  // Referral Program Configuration - NEW SYSTEM
  referralProgram: {
    enabled: true, // Enable referral tracking
    rewardType: "bill_credit", // $5 credit per successful referral
    rewardAmount: 5.00, // $5 AUD off next monthly bill
    qualificationCriteria: "paying_customer", // Referral must become paying customer
    stackableWithOtherDiscounts: true, // Can stack with VIP discount
    noReferralLimit: true, // No cap on number of referrals
    autoApplyToNextBill: true // Automatically apply to next invoice
  },

  // Case Study / Testimonial Program - Manual Use Only
  testimonialProgram: {
    enabled: true,
    manualApprovalOnly: true, // Not shown publicly, discretionary use
    reward: {
      discountPercent: 10, // 10% off Blue Core for 1 year
      tier: "bluecore",
      duration: 12 // months
    },
    requirements: {
      videoLength: "15-30 seconds",
      contentFocus: "business impact and results"
    }
  },

  // Founding Member Badge System - Status Only
  foundingMemberBadge: {
    enabled: true,
    criteria: {
      referrals: 3, // 3+ successful referrals, OR
      testimonialProvided: true, // Provided testimonial, OR
      meaningfulContribution: true // Manual assessment
    },
    benefits: {
      badge: "🏆 Founding Member",
      recognition: "Dashboard badge and status",
      pricingBenefits: false, // No connection to pricing
      featureAccess: false // No special feature access
    }
  },

  // Discount Stacking Rules - Clarified
  discountStacking: {
    vipWaitlist: {
      discount: 30,
      stacksWithReferrals: true,
      stacksWithDemo: true,
      stacksWithTestimonial: false // Cannot combine with testimonial discount
    },
    referralProgram: {
      creditAmount: 5.00,
      stacksWithVip: true,
      stacksWithDemo: true,
      stacksWithTestimonial: true
    },
    testimonialProgram: {
      discount: 10,
      stacksWithReferrals: true,
      stacksWithVip: false, // Cannot combine with VIP discount
      stacksWithDemo: false
    }
  }
};

// Helper functions
export const isLifetimeOfferEnabled = () => config.features.lifetimeAccessOffer.enabled;
export const isBetaTestingEnabled = () => false; // Beta testing feature removed
export const getPhase1Features = () => config.phases.phase1.features;
export const getPhase2PlusFeatures = () => config.phases.phase2Plus.features;

// Easy toggle function for lifetime access offer
export const toggleLifetimeOffer = (enabled: boolean) => {
  config.features.lifetimeAccessOffer.enabled = enabled;
};
// Journey data type for milestone tracking
export type JourneyData = {
  completedMilestones?: string[] | null;
  [key: string]: any; // For dynamic properties
};

// Helper utility to convert API response to typed journey data
export function toJourneyData(data: any): JourneyData | null {
  if (!data || typeof data !== 'object') return null;
  
  return {
    completedMilestones: Array.isArray(data.completedMilestones) ? data.completedMilestones : [],
    ...data
  };
}
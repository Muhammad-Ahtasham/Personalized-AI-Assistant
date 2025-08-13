import { useState, useEffect } from 'react';

interface PlanData {
  topic: string;
  plan: string;
  timestamp: number;
}

export const usePlan = () => {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load plan from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('studymate_current_plan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        // Check if plan is less than 24 hours old
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          setPlanData(parsed);
        } else {
          // Clear old plan
          localStorage.removeItem('studymate_current_plan');
        }
      } catch (error) {
        console.error('Error parsing saved plan:', error);
        localStorage.removeItem('studymate_current_plan');
      }
    }
  }, []);

  const setPlan = (topic: string, plan: string) => {
    const planData: PlanData = {
      topic,
      plan,
      timestamp: Date.now(),
    };
    setPlanData(planData);
    localStorage.setItem('studymate_current_plan', JSON.stringify(planData));
  };

  const clearPlan = () => {
    setPlanData(null);
    localStorage.removeItem('studymate_current_plan');
  };

  const updatePlan = (newPlan: string) => {
    if (planData) {
      const updatedPlanData = {
        ...planData,
        plan: newPlan,
        timestamp: Date.now(),
      };
      setPlanData(updatedPlanData);
      localStorage.setItem('studymate_current_plan', JSON.stringify(updatedPlanData));
    }
  };

  const getTimeSinceCreated = () => {
    if (!planData) return null;
    const now = Date.now();
    const diff = now - planData.timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'More than 24 hours ago';
  };

  return {
    planData,
    setPlan,
    clearPlan,
    updatePlan,
    loading,
    setLoading,
    getTimeSinceCreated,
  };
};

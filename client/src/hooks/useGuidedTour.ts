// Hook for managing guided tour state
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function useGuidedTour() {
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Define blocked routes where tour should NEVER appear
  const blockedRoutes = ["/onboarding", "/beta", "/login", "/signup"];
  // Special case: "/" is blocked only if user is not onboarded (showing onboarding screen)
  const isOnboardingRoute = location === "/" && isAuthenticated && user && !user.isOnboarded;
  const shouldShowTour = !blockedRoutes.some(route => location === route || location.startsWith(route)) 
                         && !isOnboardingRoute;

  useEffect(() => {
    // Block tour on onboarding and unauthorized routes
    if (!shouldShowTour) {
      setShowTour(false);
      return;
    }
    const completed = localStorage.getItem('blue-tradie-tour-completed');
    const onboardingCompleted = localStorage.getItem('blue-tradie-onboarding-completed');
    const userFirstVisit = localStorage.getItem('blue-tradie-first-visit-completed');
    const activeTourStep = localStorage.getItem('blue-tradie-tour-active-step');
    
    // If this is a brand new user (no first visit flag), clear any stale tour completion
    if (!userFirstVisit && completed === 'true') {
      localStorage.removeItem('blue-tradie-tour-completed');
      localStorage.removeItem('blue-tradie-tour-active-step');
    }
    
    const actualCompleted = userFirstVisit ? localStorage.getItem('blue-tradie-tour-completed') : null;
    
    if (actualCompleted === 'true') {
      setTourCompleted(true);
    } else if (onboardingCompleted === 'true' && window.location.pathname === '/' && actualCompleted !== 'true') {
      // CRITICAL FIX: Tour ONLY starts after onboarding is completed and user is on dashboard
      // Check org-specific onboarding completion
      const orgOnboardingKey = `blue-tradie-org-onboarding-completed-${window.location.hostname}`;
      const orgOnboardingCompleted = localStorage.getItem(orgOnboardingKey);
      
      if (orgOnboardingCompleted === 'true') {
        // Clear any stale step for completely fresh start but don't auto-start
        localStorage.removeItem('blue-tradie-tour-active-step');
        // Tour will start when welcome modal dispatches the start-tour-after-welcome event
        console.log('[TOUR] Org onboarding completed, waiting for welcome modal trigger');
      } else {
        console.log('[TOUR] Current org onboarding not completed, blocking tour');
        setShowTour(false);
      }
    } else if (activeTourStep && actualCompleted !== 'true' && onboardingCompleted === 'true') {
      // CRITICAL FIX: Resume tour ONLY if onboarding is completed FOR CURRENT ORG
      const orgOnboardingKey = `blue-tradie-org-onboarding-completed-${window.location.hostname}`;
      const orgOnboardingCompleted = localStorage.getItem(orgOnboardingKey);
      
      if (orgOnboardingCompleted === 'true') {
        console.log('[TOUR] Resuming tour - current org onboarding completed');
        setShowTour(true);
      } else {
        console.log('[TOUR] Current org onboarding not completed, blocking tour resume');
        setShowTour(false);
      }
    } else if (!onboardingCompleted && window.location.pathname === '/') {
      // CRITICAL FIX: NO tour for users who haven't completed onboarding
      console.log('[TOUR] Onboarding not completed, blocking tour');
      setShowTour(false);
    }
  }, [location, shouldShowTour]);

  // Listen for welcome modal completion and tour reset events to show tour
  useEffect(() => {
    const handleStartTourAfterWelcome = () => {

      setShowTour(true);
    };

    const handleTourReset = () => {

      setShowTour(true);
    };

    window.addEventListener('start-tour-after-welcome', handleStartTourAfterWelcome);
    window.addEventListener('tour-reset', handleTourReset);
    
    return () => {
      window.removeEventListener('start-tour-after-welcome', handleStartTourAfterWelcome);
      window.removeEventListener('tour-reset', handleTourReset);
    };
  }, []);

  // Auto-start tour for first-time login users
  useEffect(() => {
    if (!isAuthenticated || !user || !shouldShowTour) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const isFreshLogin = urlParams.get('fresh') === '1';
    const tourCompleted = localStorage.getItem('blue-tradie-tour-completed') === 'true';
    
    if (isFreshLogin && !tourCompleted && user.isOnboarded) {
      // Clear the URL parameter for cleaner experience
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Start the tour automatically for first-time users
      console.log('[TOUR] First-time login detected, starting welcome tour');
      setTimeout(() => {
        startTour();
      }, 1000); // Small delay to let the page load
    }
  }, [isAuthenticated, user, shouldShowTour]);

  const startTour = () => {
    localStorage.removeItem('blue-tradie-tour-completed');
    localStorage.setItem('blue-tradie-tour-active-step', '0');
    setTourCompleted(false);
    setShowTour(true);
  };

  const closeTour = () => {
    setShowTour(false);
  };

  const completeTour = () => {
    setShowTour(false);
    setTourCompleted(true);
    localStorage.setItem('blue-tradie-tour-completed', 'true');
    localStorage.removeItem('blue-tradie-tour-active-step');
  };

  const resetTour = () => {
    localStorage.removeItem('blue-tradie-tour-completed');
    localStorage.setItem('blue-tradie-tour-active-step', '0');
    setTourCompleted(false);
    setShowTour(true);
    
    // Dispatch custom event to notify GuidedTour component
    window.dispatchEvent(new CustomEvent('tour-reset'));
  };

  return {
    showTour,
    tourCompleted,
    startTour,
    closeTour,
    completeTour,
    resetTour
  };
}
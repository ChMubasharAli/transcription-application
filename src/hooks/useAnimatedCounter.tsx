import { useState, useEffect } from 'react';

interface UseAnimatedCounterProps {
  targetValue: number;
  duration?: number;
  startValue?: number;
  fluctuate?: boolean;
  fluctuationRange?: number;
}

export const useAnimatedCounter = ({
  targetValue,
  duration = 2000,
  startValue = 0,
  fluctuate = false,
  fluctuationRange = 2
}: UseAnimatedCounterProps) => {
  const [currentValue, setCurrentValue] = useState(startValue);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const steps = 60; // 60fps
    const stepDuration = duration / steps;
    const increment = (targetValue - startValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newValue = startValue + (increment * currentStep);
      
      if (currentStep >= steps) {
        setCurrentValue(targetValue);
        setIsAnimating(false);
        clearInterval(timer);
        
        // Start fluctuation after initial animation
        if (fluctuate) {
          startFluctuation();
        }
      } else {
        setCurrentValue(newValue);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [targetValue, duration, startValue]);

  const startFluctuation = () => {
    const fluctuationTimer = setInterval(() => {
      const randomVariation = (Math.random() - 0.5) * fluctuationRange;
      const fluctuatedValue = targetValue + randomVariation;
      setCurrentValue(Math.max(0, fluctuatedValue));
    }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds

    return () => clearInterval(fluctuationTimer);
  };

  return Math.round(currentValue * 100) / 100; // Round to 2 decimal places
};

export const useFluctuatingNumber = (baseValue: number, range: number = 2) => {
  const [value, setValue] = useState(baseValue);

  useEffect(() => {
    const interval = setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * range;
      setValue(baseValue + fluctuation);
    }, 1500 + Math.random() * 1000); // Random interval between 1.5-2.5 seconds

    return () => clearInterval(interval);
  }, [baseValue, range]);

  return Math.round(value * 100) / 100;
};
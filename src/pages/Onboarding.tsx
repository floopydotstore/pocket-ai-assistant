import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Lock, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAgentStore } from '@/store/agentStore';

const onboardingSlides = [
  {
    icon: Sparkles,
    title: 'Your Pocket AI Agents',
    description: 'Create lightweight AI assistants for everyday micro-tasks. Summarize text, draft emails, research topics, and more.',
    color: 'text-primary',
    bgColor: 'bg-accent',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays on your device by default. Cloud sync is optional and requires your explicit consent.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
  },
  {
    icon: Lock,
    title: 'Minimal Permissions',
    description: 'We only request internet access. No contacts, location, or other sensitive permissions needed.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const setOnboardingComplete = useAgentStore((s) => s.setOnboardingComplete);

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    setOnboardingComplete();
    navigate('/dashboard');
  };

  const slide = onboardingSlides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={handleGetStarted} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Icon */}
        <div
          className={`w-24 h-24 rounded-3xl ${slide.bgColor} flex items-center justify-center mb-8 animate-scale-in`}
          key={currentSlide}
        >
          <Icon className={`w-12 h-12 ${slide.color}`} />
        </div>

        {/* Text */}
        <div className="text-center max-w-sm animate-fade-in" key={`text-${currentSlide}`}>
          <h1 className="text-2xl font-bold mb-4 text-foreground">{slide.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{slide.description}</p>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mt-10">
          {onboardingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-6 pb-8 space-y-3">
        <Button variant="hero" size="xl" className="w-full" onClick={handleNext}>
          {currentSlide < onboardingSlides.length - 1 ? (
            <>
              Next
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Get Started
            </>
          )}
        </Button>

        {currentSlide === onboardingSlides.length - 1 && (
          <Card variant="ghost" className="p-4 bg-muted/50 animate-slide-up">
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our{' '}
              <a href="https://floopy.store/terms.html" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://floopy.store/privacy.html" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

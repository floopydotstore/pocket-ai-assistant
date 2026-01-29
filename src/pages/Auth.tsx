import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Mail, Lock, User, ArrowLeft, Bot, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const emailSchema = z.string().email('Invalid email address').max(255, 'Email too long');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password too long');
const displayNameSchema = z.string().max(100, 'Name too long').optional();

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signUp, signIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string; displayName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0]?.message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0]?.message;
    }

    if (isSignUp && displayName) {
      const nameResult = displayNameSchema.safeParse(displayName);
      if (!nameResult.success) {
        newErrors.displayName = nameResult.error.errors[0]?.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (!error) {
        navigate('/dashboard', { replace: true });
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        navigate('/dashboard', { replace: true });
      }
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-top flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-12 w-12 rounded-xl border-border"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-8 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Logo */}
          <div className="text-center space-y-4">
           <img src="/app-icon.png" alt="App-icon" className="h-16 w-16 mx-auto" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">PocketAgent</h1>
              <p className="text-muted-foreground">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card variant="elevated">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? 'Create an account to sync agents across devices'
                  : 'Sign in to access your agents'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                      Display Name (optional)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy note */}
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="https://floopy.store/terms.html" target="_blank" className="text-primary hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="https://floopy.store/privacy.html" target="_blank" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

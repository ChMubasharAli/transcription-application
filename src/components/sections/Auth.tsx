import { useState, useEffect } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, ChevronDown, Check, CalendarIcon, Mail, Lock } from 'lucide-react';
import prepSmartLogo from '@/assets/prep-smart-logo-new.png';
import { countryCodes, CountryCode } from '@/data/countryCodes';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
interface AuthProps {
  onBackToHome: () => void;
  onAuthSuccess: () => void;
}
const Auth = ({
  onBackToHome,
  onAuthSuccess
}: AuthProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Load languages on component mount
  React.useEffect(() => {
    const loadLanguages = async () => {
      const {
        data,
        error
      } = await supabase.from('languages').select('id, name').order('name');
      if (error) {
        console.error('Error loading languages:', error);
      } else {
        setLanguages(data || []);
      }
    };
    loadLanguages();
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [examDate, setExamDate] = useState<Date>();
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languages, setLanguages] = useState<{
    id: string;
    name: string;
  }[]>([]);
  // Default to Australia (+61)
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(countryCodes.find(c => c.code === 'AU') || countryCodes[0]);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [examDatePickerOpen, setExamDatePickerOpen] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Can be email or phone
  const {
    toast
  } = useToast();
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Always use email for sign-in since phone auth requires different setup
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email: loginIdentifier,
        password
      });
      if (error) {
        console.error('Login error details:', error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in."
        });
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number.",
        variant: "destructive"
      });
      return;
    }
    if (!examDate) {
      toast({
        title: "Exam Date Required",
        description: "Please select your NAATI CCL exam date.",
        variant: "destructive"
      });
      return;
    }
    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select your preferred language for CCL practice.",
        variant: "destructive"
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone_number: `${selectedCountryCode.dialCode}${phoneNumber}`,
            exam_date: examDate.toISOString().split('T')[0],
            // Format as YYYY-MM-DD
            language_id: selectedLanguage
          }
        }
      });
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Welcome to PREP SMART CCL! Redirecting to dashboard..."
        });
        // Redirect to dashboard after successful account creation
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Futuristic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 animate-pulse" style={{
          backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
              `,
          backgroundSize: '60px 60px',
          animation: 'grid-glow 4s ease-in-out infinite alternate'
        }} />
        </div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => <div key={i} className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-bounce" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }} />)}
        </div>

        {/* Neon Wave Pattern */}
        <div className="absolute bottom-0 left-0 w-full h-32 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" fill="url(#wave-gradient)" className="animate-pulse" />
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0, 255, 255, 0.5)" />
                <stop offset="50%" stopColor="rgba(0, 255, 0, 0.5)" />
                <stop offset="100%" stopColor="rgba(0, 255, 255, 0.5)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBackToHome} className="mb-6 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Glassmorphism Auth Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-cyan-400/20 rounded-2xl shadow-2xl animate-fade-in hover:border-cyan-400/40 transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,255,255,0.3)]">
          <div className="text-center space-y-6 p-8 pb-4">
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                Welcome to PREP SMART CCL
              </h1>
              <p className="text-cyan-300 text-lg animate-pulse" style={{
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}>
                Access Your AI-Powered NAATI CCL Practice
              </p>
            </div>
          </div>

          <div className="p-8 pt-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/20 rounded-xl p-1 border border-cyan-400/20">
                <TabsTrigger value="login" className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-green-500 data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(0,255,255,0.5)] text-cyan-300 hover:text-cyan-100 hover:bg-cyan-400/10">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-green-500 data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(0,255,255,0.5)] text-cyan-300 hover:text-cyan-100 hover:bg-cyan-400/10">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="login-identifier" className="text-cyan-300 font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
                      <Input id="login-identifier" type="email" placeholder="Enter your email address" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 pl-11 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="login-password" className="text-cyan-300 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
                      <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 pl-11 pr-12 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-0 hover:bg-transparent text-cyan-400 hover:text-cyan-300" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <button type="button" className="text-cyan-400 text-sm hover:text-cyan-300 hover:underline transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
                      Forgot your password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                    <span className="relative z-10">
                      {isLoading ? "Signing In..." : "Sign In"}
                    </span>
                  </Button>
                  
                  {/* TEMPORARY: Direct admin access for testing */}
                  <Button
                    type="button"
                    onClick={() => {
                      window.location.hash = 'admin';
                      window.location.reload();
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,0,0.6)] mt-3"
                  >
                    <span className="relative z-10">
                      🔧 Access Admin Panel (DEV MODE)
                    </span>
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="signup-name" className="text-cyan-300 font-medium">Full Name</Label>
                    <Input id="signup-name" type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-phone" className="text-cyan-300 font-medium">Phone Number</Label>
                    <div className="flex gap-3">
                      <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={countrySearchOpen} className="w-40 justify-between bg-black/20 border-cyan-400/30 text-white hover:bg-black/30 hover:border-cyan-400/50 rounded-xl py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{selectedCountryCode.flag}</span>
                              <span className="text-sm">{selectedCountryCode.dialCode}</span>
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 bg-black/90 backdrop-blur-xl border-cyan-400/20 shadow-2xl z-50">
                          <Command className="bg-transparent">
                            <CommandInput placeholder="Search countries..." className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400" />
                            <CommandList className="max-h-60 overflow-y-auto">
                              <CommandEmpty className="text-gray-400">No country found.</CommandEmpty>
                              <CommandGroup>
                                {countryCodes.map(country => <CommandItem key={country.code} value={`${country.name} ${country.dialCode}`} onSelect={() => {
                                setSelectedCountryCode(country);
                                setCountrySearchOpen(false);
                              }} className="cursor-pointer hover:bg-cyan-400/10 text-white">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-3">
                                        <span className="text-lg">{country.flag}</span>
                                        <span className="text-sm">{country.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400">{country.dialCode}</span>
                                        {selectedCountryCode.code === country.code && <Check className="h-4 w-4 text-cyan-400" />}
                                      </div>
                                    </div>
                                  </CommandItem>)}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input id="signup-phone" type="tel" placeholder="Enter phone number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="flex-1 bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-cyan-300 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
                      <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 pl-11 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-cyan-300 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
                      <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 pl-11 pr-12 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-0 hover:bg-transparent text-cyan-400 hover:text-cyan-300" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirm-password" className="text-cyan-300 font-medium">Confirm Password</Label>
                    <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="bg-black/20 border-cyan-400/30 text-white placeholder-gray-400 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="language" className="text-cyan-300 font-medium">
                      Preferred Language <span className="text-red-400">*</span>
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="bg-black/20 border-cyan-400/30 text-white hover:bg-black/30 hover:border-cyan-400/50 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50">
                        <SelectValue placeholder="Select your language for CCL practice" className="text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-xl border-cyan-400/20 shadow-2xl">
                        {languages.map(language => <SelectItem key={language.id} value={language.id} className="text-white hover:bg-cyan-400/10 focus:bg-cyan-400/20">
                            {language.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="exam-date" className="text-cyan-300 font-medium">
                      NAATI CCL Exam Date <span className="text-red-400">*</span>
                    </Label>
                    <Popover open={examDatePickerOpen} onOpenChange={setExamDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-black/20 border-cyan-400/30 text-white hover:bg-black/30 hover:border-cyan-400/50 py-3 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50", !examDate && "text-gray-400")}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-cyan-400" />
                          {examDate ? format(examDate, "PPP") : <span>Pick your exam date *</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black/90 backdrop-blur-xl border-cyan-400/20 shadow-2xl z-50" align="start">
                        <Calendar mode="single" selected={examDate} onSelect={date => {
                        setExamDate(date);
                        setExamDatePickerOpen(false);
                      }} disabled={date => date < new Date() || date < new Date("2025-01-01")} initialFocus className={cn("p-3 pointer-events-auto text-white")} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                    <span className="relative z-10">
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </span>
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;
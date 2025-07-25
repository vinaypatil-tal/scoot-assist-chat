import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Zap, Phone, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AuthPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if phone number already exists in profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (profileError) {
        throw new Error("Failed to check existing user");
      }

      // If phone number exists, just proceed with OTP simulation
      setTimeout(() => {
        setIsLoading(false);
        setOtpSent(true);
        toast({
          title: "OTP Sent (Simulated)",
          description: existingProfile 
            ? "Welcome back! Enter any code to continue."
            : "New number detected! Enter any code to continue.",
        });
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate OTP verification - any OTP will work
    setTimeout(async () => {
      try {
        // Check if phone number already exists in profiles table
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, phone_number, full_name')
          .eq('phone_number', phoneNumber)
          .maybeSingle();

        if (profileError) {
          throw new Error("Failed to check existing user");
        }

        if (existingProfile) {
          // Phone number exists - only try to sign in, don't create new account
          console.log('Existing customer found, logging in...');
          
          const tempEmail = `customer_${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
          const tempPassword = `temp_${phoneNumber}_password`;
          
          // Only try to sign in with existing credentials
          const authResult = await supabase.auth.signInWithPassword({
            email: tempEmail,
            password: tempPassword,
          });

          if (authResult.error) {
            // If sign in fails, it means the auth account doesn't exist yet
            // but the profile exists, so we need to create the auth account once
            const signUpResult = await supabase.auth.signUp({
              email: tempEmail,
              password: tempPassword,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                  phone_number: phoneNumber,
                  full_name: existingProfile.full_name
                }
              }
            });

            if (signUpResult.error) {
              // If we get "User already registered", try signing in again
              if (signUpResult.error.message.includes('User already registered')) {
                const retryResult = await supabase.auth.signInWithPassword({
                  email: tempEmail,
                  password: tempPassword,
                });
                if (retryResult.error) throw retryResult.error;
              } else {
                throw signUpResult.error;
              }
            }
          }

          toast({
            title: "Welcome Back!",
            description: "Login successful! You're now logged in.",
          });
        } else {
          // Phone number is new - create user in profile table
          console.log('New phone number, creating user...');
          
          const tempEmail = `customer_${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
          const tempPassword = `temp_${phoneNumber}_password`;

          // Create auth account
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: tempEmail,
            password: tempPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                phone_number: phoneNumber,
                full_name: null
              }
            }
          });

          if (authError) {
            // If user already exists in auth but not in profiles, try to sign in
            if (authError.message.includes('User already registered')) {
              const signInResult = await supabase.auth.signInWithPassword({
                email: tempEmail,
                password: tempPassword,
              });
              if (signInResult.error) throw signInResult.error;
              
              if (signInResult.data.user) {
                // Check if profile already exists for this user
                const { data: existingUserProfile, error: checkError } = await supabase
                  .from('profiles')
                  .select('user_id')
                  .eq('user_id', signInResult.data.user.id)
                  .maybeSingle();

                if (checkError) {
                  console.error('Error checking existing profile:', checkError);
                  throw new Error("Failed to verify user profile");
                }

                // Only create profile if it doesn't exist
                if (!existingUserProfile) {
                  const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                      user_id: signInResult.data.user.id,
                      phone_number: phoneNumber,
                      full_name: null
                    });

                  if (profileError) {
                    console.error('Error creating profile:', profileError);
                    // Check if it's a duplicate key error (profile was created by another process)
                    if (profileError.code === '23505') {
                      console.log('Profile already exists, continuing...');
                    } else {
                      throw new Error("Failed to create customer profile");
                    }
                  }
                }
              }
            } else {
              throw authError;
            }
          } else if (authData.user) {
            // Create new profile mapping UI mobile number with phone_number column
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                user_id: authData.user.id,
                phone_number: phoneNumber, // Map UI mobile number to phone_number column
                full_name: null
              });

            if (profileError) {
              console.error('Error creating profile:', profileError);
              throw new Error("Failed to create customer profile");
            }
          }

          toast({
            title: "Welcome!",
            description: "Account setup completed successfully! You're now logged in.",
          });
        }
      } catch (error: any) {
        console.error('Authentication error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to sign in",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };



  if (otpSent) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-slide-up">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-electric rounded-2xl shadow-electric">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-electric bg-clip-text text-transparent">
                ElectroScoot
              </h1>
              <p className="text-muted-foreground">Enter Verification Code</p>
            </div>
          </div>

          <Card className="shadow-soft border-0">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to {phoneNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    className="gap-2"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button
                  type="submit"
                  variant="electric"
                  size="mobile"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="mobile"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  Back to Phone Number
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-electric rounded-2xl shadow-electric">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-electric bg-clip-text text-transparent">
              ElectroScoot
            </h1>
            <p className="text-muted-foreground">Customer Support</p>
          </div>
        </div>

        <Card className="shadow-soft border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription>
              Get instant support for your electric scooter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-12 rounded-lg border-border/50 focus:border-primary"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                variant="electric"
                size="mobile"
                className="w-full"
                disabled={isLoading || !phoneNumber.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Get OTP
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-xs text-muted-foreground text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2 opacity-80">
          <p className="text-sm text-muted-foreground">
            Need immediate help? Call us at{" "}
            <a href="tel:+1-800-ESCOOT" className="text-primary hover:underline font-medium">
              1-800-ESCOOT
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
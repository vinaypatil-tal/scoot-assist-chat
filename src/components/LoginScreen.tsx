import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Zap, Phone, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate OTP sending delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin(); // For now, directly login. In real app, this would trigger OTP verification
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Brand Header */}
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

        {/* Login Card */}
        <Card className="shadow-soft border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>
              Enter your mobile number to get instant support for your electric scooter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
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

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Support Info */}
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
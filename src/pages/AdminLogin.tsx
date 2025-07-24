import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Lock, Phone } from "lucide-react";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simple password check - in production this would be more secure
  const ADMIN_PASSWORD = "admin123";

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      // Store admin session in localStorage (simple approach)
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminLoginMethod", "password");
      
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      });
      
      navigate("/admin");
    } else {
      toast({
        title: "Login Failed", 
        description: "Invalid password",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    setShowOtpField(true);
    setIsLoading(false);
    
    toast({
      title: "OTP Sent",
      description: `OTP sent to ${phoneNumber}. Enter any 6-digit code to proceed.`,
    });
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate OTP verification - accept any 6-digit code
    await new Promise(resolve => setTimeout(resolve, 500));

    if (otp.length === 6) {
      // Store admin session in localStorage
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminLoginMethod", "mobile");
      localStorage.setItem("adminPhone", phoneNumber);
      
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      });
      
      navigate("/admin");
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Choose your preferred login method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Mobile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="password" className="mt-4">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login with Password"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="mobile" className="mt-4">
              {!showOtpField ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      OTP sent to {phoneNumber}. Enter any 6-digit code.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowOtpField(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-sm"
            >
              Back to Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
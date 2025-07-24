import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Settings,
  MessageSquare,
  Users,
  Database
} from "lucide-react";
import { FAQManagement } from "@/components/admin/FAQManagement";

interface ManualReviewRequest {
  id: string;
  user_id: string;
  phone_number: string;
  original_query: string;
  user_feedback: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewRequests, setReviewRequests] = useState<ManualReviewRequest[]>([]);
  const [adminLoginMethod, setAdminLoginMethod] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check simple admin authentication first
      const adminAuth = localStorage.getItem("adminAuthenticated");
      if (!adminAuth) {
        navigate("/admin-login");
        return;
      }

      // Get admin login method and phone
      const loginMethod = localStorage.getItem("adminLoginMethod");
      const phoneNumber = localStorage.getItem("adminPhone");
      setAdminLoginMethod(loginMethod);
      setAdminPhone(phoneNumber);

      // For simple admin auth, skip Supabase user checks
      if (loginMethod === "mobile") {
        setIsAdmin(true);
        await loadData();
        setLoading(false);
        return;
      }

      // Fallback to original Supabase auth flow
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load manual review requests
      const { data: reviewData } = await supabase
        .from('manual_review_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewData) {
        setReviewRequests(reviewData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear admin authentication
      localStorage.removeItem("adminAuthenticated");
      localStorage.removeItem("adminLoginMethod");
      localStorage.removeItem("adminPhone");
      
      // Only sign out from Supabase if using Supabase auth
      if (adminLoginMethod !== "mobile") {
        await supabase.auth.signOut();
      }
      
      navigate("/admin-login");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateReviewStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('manual_review_requests')
        .update({ status, admin_user_id: user?.id })
        .eq('id', requestId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  

  return (
    <div className="min-h-screen bg-gradient-chat">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-electric rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-xl">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage FAQ content and review requests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                  Admin Access
                </Badge>
                {adminLoginMethod && (
                  <div className="text-xs text-muted-foreground">
                    {adminLoginMethod === "mobile" && adminPhone 
                      ? `Mobile: ${adminPhone}` 
                      : "Supabase Auth"}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="faqs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Manage FAQs
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Review Requests
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faqs" className="space-y-6">
            <FAQManagement />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Review Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-card rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{request.original_query}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Feedback: {request.user_feedback}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From: {request.phone_number} • {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={request.status === 'pending' ? 'destructive' : 'secondary'}
                          >
                            {request.status}
                          </Badge>
                          <select 
                            value={request.status}
                            onChange={(e) => updateReviewStatus(request.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Save, 
  X,
  Settings,
  MessageSquare,
  Users,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  keywords: string[];
  display_order: number;
  is_active: boolean;
}

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
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ManualReviewRequest[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewFAQ, setShowNewFAQ] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
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
      // Load FAQ categories
      const { data: categoriesData } = await supabase
        .from('faq_categories')
        .select('*')
        .order('display_order');

      if (categoriesData) {
        setCategories(categoriesData);
        if (categoriesData.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesData[0].id);
        }
      }

      // Load FAQ items
      const { data: faqData } = await supabase
        .from('faq_items')
        .select('*')
        .order('display_order');

      if (faqData) {
        setFaqItems(faqData);
      }

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
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const saveCategory = async (categoryData: Omit<FAQCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingCategory && editingCategory !== 'new') {
        // Update existing category
        const { error } = await supabase
          .from('faq_categories')
          .update(categoryData)
          .eq('id', editingCategory);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('faq_categories')
          .insert(categoryData);

        if (error) throw error;
      }

      await loadData();
      setEditingCategory(null);
      setShowNewCategory(false);
      
      toast({
        title: "Success",
        description: "Category saved successfully",
      });
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const saveFAQ = async (faqData: Omit<FAQItem, 'id' | 'created_at' | 'updated_at' | 'category_id'>) => {
    try {
      if (editingFAQ && editingFAQ !== 'new') {
        // Update existing FAQ
        const { error } = await supabase
          .from('faq_items')
          .update(faqData)
          .eq('id', editingFAQ);

        if (error) throw error;
      } else {
        // Create new FAQ
        const { error } = await supabase
          .from('faq_items')
          .insert({ ...faqData, category_id: selectedCategory });

        if (error) throw error;
      }

      await loadData();
      setEditingFAQ(null);
      setShowNewFAQ(false);
      
      toast({
        title: "Success",
        description: "FAQ saved successfully",
      });
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to save FAQ",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const deleteFAQ = async (faqId: string) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', faqId);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
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

  const selectedCategoryFAQs = faqItems.filter(faq => faq.category_id === selectedCategory);

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
              <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                Admin Access
              </Badge>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Categories */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Categories</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setShowNewCategory(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedCategory === category.id 
                          ? "bg-primary/10 border-primary" 
                          : "bg-card hover:bg-accent/50"
                      )}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium capitalize">{category.name}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(category.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCategory(category.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* FAQs */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    FAQ Items {selectedCategory && `- ${categories.find(c => c.id === selectedCategory)?.name}`}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setShowNewFAQ(true)}
                    disabled={!selectedCategory}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCategoryFAQs.map((faq) => (
                    <div key={faq.id} className="p-4 bg-card rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{faq.question}</h4>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingFAQ(faq.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteFAQ(faq.id)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{faq.answer}</p>
                      <div className="flex flex-wrap gap-1">
                        {faq.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
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
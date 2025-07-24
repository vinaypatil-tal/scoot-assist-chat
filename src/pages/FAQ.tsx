import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  Zap, 
  ArrowLeft, 
  Info, 
  Battery, 
  Shield, 
  Wrench, 
  Truck,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  display_order: number;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  keywords: string[];
  display_order: number;
}

const iconMap = {
  Info,
  Battery,
  Shield,
  Wrench,
  Truck,
};

export function FAQ() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FAQItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFAQData();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [searchQuery, selectedCategory, faqItems]);

  const loadFAQData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Load FAQ items
      const { data: itemsData, error: itemsError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setFaqItems(itemsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load FAQ data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFAQs = () => {
    let filtered = faqItems;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredItems(filtered);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Info;
    return IconComponent;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading FAQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-chat">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-electric rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
              <p className="text-muted-foreground">Find answers to common questions about ElectroScoot</p>
            </div>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="space-y-6 mb-8">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search for questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Browse by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="gap-2"
                >
                  All Categories
                </Button>
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon_name);
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.id)}
                      className="gap-2"
                    >
                      <IconComponent className="w-4 h-4" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedCategory 
                    ? getCategoryName(selectedCategory)
                    : `All Questions`}
                </CardTitle>
                <CardDescription>
                  {filteredItems.length} question{filteredItems.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </CardDescription>
              </div>
              <Link to="/support">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No questions match "${searchQuery}". Try different keywords or browse categories.`
                    : "No questions found in this category."
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-left flex-1">
                          <div className="font-medium">{item.question}</div>
                          {!selectedCategory && (
                            <Badge variant="secondary" className="mt-1">
                              {getCategoryName(item.category_id)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-muted-foreground">{item.answer}</p>
                        </div>
                        {item.keywords.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="text-xs text-muted-foreground mb-2">Related topics:</div>
                            <div className="flex flex-wrap gap-1">
                              {item.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            Can't find what you're looking for?
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/support">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat with Support
              </Button>
            </Link>
            <a href="tel:+1-800-ESCOOT">
              <Button variant="outline">
                Call 1-800-ESCOOT
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
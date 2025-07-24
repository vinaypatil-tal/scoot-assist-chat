import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Info,
  Battery,
  Shield,
  Wrench,
  Truck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  category?: FAQCategory;
}

const iconOptions = [
  { value: 'Info', label: 'Info', icon: Info },
  { value: 'Battery', label: 'Battery', icon: Battery },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'Wrench', label: 'Wrench', icon: Wrench },
  { value: 'Truck', label: 'Truck', icon: Truck },
];

export function FAQManagement() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('faq_categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Load FAQ items with categories
      const { data: itemsData, error: itemsError } = await supabase
        .from('faq_items')
        .select(`
          *,
          category:faq_categories(*)
        `)
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

  const saveCategory = async (category: Partial<FAQCategory> & { name: string }) => {
    try {
      if (category.id) {
        // Update existing category
        const { error } = await supabase
          .from('faq_categories')
          .update(category)
          .eq('id', category.id);

        if (error) throw error;
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        // Create new category
        const { error } = await supabase
          .from('faq_categories')
          .insert(category);

        if (error) throw error;
        toast({ title: "Success", description: "Category created successfully" });
      }

      await loadData();
      setEditingCategory(null);
      setShowCategoryDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save category: " + error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Category deleted successfully" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete category: " + error.message,
        variant: "destructive",
      });
    }
  };

  const saveFAQItem = async (item: any) => {
    try {
      // Convert keywords string to array if needed
      const itemToSave = { ...item };
      if (typeof itemToSave.keywords === 'string') {
        itemToSave.keywords = itemToSave.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);
      }

      if (itemToSave.id) {
        // Update existing item
        const { error } = await supabase
          .from('faq_items')
          .update(itemToSave)
          .eq('id', itemToSave.id);

        if (error) throw error;
        toast({ title: "Success", description: "FAQ item updated successfully" });
      } else {
        // Create new item
        const { error } = await supabase
          .from('faq_items')
          .insert(itemToSave);

        if (error) throw error;
        toast({ title: "Success", description: "FAQ item created successfully" });
      }

      await loadData();
      setEditingItem(null);
      setShowItemDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save FAQ item: " + error.message,
        variant: "destructive",
      });
    }
  };

  const deleteFAQItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "FAQ item deleted successfully" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete FAQ item: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-muted-foreground">Manage FAQ categories and questions</p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">FAQ Items</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Categories</h3>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCategory(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <CategoryDialog
                category={editingCategory}
                onSave={saveCategory}
                onClose={() => setShowCategoryDialog(false)}
              />
            </Dialog>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {iconOptions.find(opt => opt.value === category.icon_name)?.icon && (
                          React.createElement(iconOptions.find(opt => opt.value === category.icon_name)!.icon, { className: "w-5 h-5" })
                        )}
                        <div>
                          <h4 className="font-semibold">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">FAQ Items</h3>
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingItem(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ Item
                </Button>
              </DialogTrigger>
              <FAQItemDialog
                item={editingItem}
                categories={categories}
                onSave={saveFAQItem}
                onClose={() => setShowItemDialog(false)}
              />
            </Dialog>
          </div>

          <div className="grid gap-4">
            {faqItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {categories.find(c => c.id === item.category_id)?.name}
                          </Badge>
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{item.question}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.answer.substring(0, 150)}...
                        </p>
                        {item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setShowItemDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteFAQItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryDialog({ 
  category, 
  onSave, 
  onClose 
}: { 
  category: FAQCategory | null; 
  onSave: (category: Partial<FAQCategory>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'Info',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon_name: category.icon_name,
        display_order: category.display_order,
        is_active: category.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon_name: 'Info',
        display_order: 0,
        is_active: true,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = category ? { ...formData, id: category.id } : formData;
    onSave(dataToSave);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogDescription>
          {category ? 'Update the category details' : 'Create a new FAQ category'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="icon">Icon</Label>
          <Select
            value={formData.icon_name}
            onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function FAQItemDialog({ 
  item, 
  categories, 
  onSave, 
  onClose 
}: { 
  item: FAQItem | null; 
  categories: FAQCategory[];
  onSave: (item: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    keywords: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        category_id: item.category_id,
        question: item.question,
        answer: item.answer,
        keywords: item.keywords.join(', '),
        display_order: item.display_order,
        is_active: item.is_active,
      });
    } else {
      setFormData({
        category_id: categories[0]?.id || '',
        question: '',
        answer: '',
        keywords: '',
        display_order: 0,
        is_active: true,
      });
    }
  }, [item, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = item ? { ...formData, id: item.id } : formData;
    onSave(dataToSave);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit FAQ Item' : 'Add FAQ Item'}</DialogTitle>
        <DialogDescription>
          {item ? 'Update the FAQ item details' : 'Create a new FAQ item'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="answer">Answer</Label>
          <Textarea
            id="answer"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            rows={4}
            required
          />
        </div>
        <div>
          <Label htmlFor="keywords">Keywords (comma-separated)</Label>
          <Input
            id="keywords"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="battery, charging, power"
          />
        </div>
        <div>
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
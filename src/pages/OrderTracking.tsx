import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_name: string;
  product_model: string;
  order_amount: number;
  order_date: string;
  estimated_delivery: string;
  actual_delivery_date?: string;
  delivery_status: string;
  tracking_number: string;
  delivery_address: string;
  delivery_notes?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <Clock className="w-4 h-4" />;
    case 'processing':
      return <Package className="w-4 h-4" />;
    case 'shipped':
      return <Truck className="w-4 h-4" />;
    case 'out_for_delivery':
      return <MapPin className="w-4 h-4" />;
    case 'delivered':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'shipped':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'out_for_delivery':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function OrderTracking() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchResult, setSearchResult] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [searching, setSearching] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Create order form state
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    product_name: "",
    product_model: "",
    order_amount: "",
    estimated_delivery: "",
    actual_delivery_date: "",
    delivery_status: "confirmed",
    delivery_address: "",
    delivery_notes: ""
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);
      await loadUserOrders();
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrders = async () => {
    try {
      console.log('Loading all orders...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      console.log('All orders query result:', { data, error, count: data?.length });

      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      if (data) {
        setUserOrders(data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const searchOrder = async () => {
    if (!searchOrderId.trim()) {
      toast({
        title: "Order ID Required",
        description: "Please enter an order ID to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      console.log('Searching for order ID:', searchOrderId.trim());
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', searchOrderId.trim())
        .maybeSingle();

      console.log('Search result:', { data, error });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Error",
          description: "An error occurred while searching for the order",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Order Not Found",
          description: "No order found with that ID. Please check and try again.",
          variant: "destructive",
        });
        setSearchResult(null);
        return;
      }

      setSearchResult(data);
      toast({
        title: "Order Found",
        description: "Order details loaded successfully",
      });
    } catch (error) {
      console.error('Error searching order:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for the order",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const createOrder = async () => {
    // Validate required fields
    if (!newOrder.customer_name || !newOrder.product_name || !newOrder.order_amount || !newOrder.delivery_address) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in customer name, product name, order amount, and delivery address",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create an order",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Generate order ID
      const currentYear = new Date().getFullYear();
      const orderNumber = Math.floor(Math.random() * 9999).toString().padStart(3, '0');
      const orderId = `ES-${currentYear}-${orderNumber}`;
      
      // Generate tracking number
      const trackingNumber = `ES${currentYear}${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}-TRACK`;

      // Use provided estimated delivery or calculate default (7 days from now)
      let estimatedDelivery;
      if (newOrder.estimated_delivery) {
        estimatedDelivery = newOrder.estimated_delivery;
      } else {
        const defaultDelivery = new Date();
        defaultDelivery.setDate(defaultDelivery.getDate() + 7);
        estimatedDelivery = defaultDelivery.toISOString().split('T')[0];
      }

      const orderData = {
        user_id: user.id,
        order_id: orderId,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone || null,
        customer_email: newOrder.customer_email || null,
        product_name: newOrder.product_name,
        product_model: newOrder.product_model || null,
        order_amount: parseFloat(newOrder.order_amount),
        estimated_delivery: estimatedDelivery,
        actual_delivery_date: newOrder.actual_delivery_date || null,
        delivery_status: newOrder.delivery_status,
        tracking_number: trackingNumber,
        delivery_address: newOrder.delivery_address,
        delivery_notes: newOrder.delivery_notes || null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        toast({
          title: "Error Creating Order",
          description: "An error occurred while creating the order",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order Created Successfully",
        description: `Order ${orderId} has been created`,
      });

      // Reset form and close dialog
      setNewOrder({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        product_name: "",
        product_model: "",
        order_amount: "",
        estimated_delivery: "",
        actual_delivery_date: "",
        delivery_status: "confirmed",
        delivery_address: "",
        delivery_notes: ""
      });
      setCreateOrderOpen(false);

      // Reload orders
      await loadUserOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error Creating Order",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const OrderCard = ({ order, showCustomerInfo = false }: { order: Order; showCustomerInfo?: boolean }) => (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
          <Badge className={cn("flex items-center gap-1", getStatusColor(order.delivery_status))}>
            {getStatusIcon(order.delivery_status)}
            {formatStatus(order.delivery_status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Product Details</h4>
            <p className="font-medium">{order.product_name}</p>
            <p className="text-sm text-muted-foreground">{order.product_model}</p>
            <p className="text-lg font-semibold text-primary">${order.order_amount}</p>
          </div>
          
          {showCustomerInfo && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Customer Info</h4>
              <p className="font-medium">{order.customer_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                {order.customer_phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                {order.customer_email}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Delivery Info</h4>
            <div className="flex items-center gap-2 text-sm mb-1">
              <Calendar className="w-3 h-3" />
              Ordered: {new Date(order.order_date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-sm mb-1">
              <Truck className="w-3 h-3" />
              Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
            </div>
            {order.actual_delivery_date && (
              <div className="flex items-center gap-2 text-sm mb-1">
                <CheckCircle className="w-3 h-3" />
                Delivered: {new Date(order.actual_delivery_date).toLocaleDateString()}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Tracking: <span className="font-mono">{order.tracking_number}</span>
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Delivery Address</h4>
            <p className="text-sm">{order.delivery_address}</p>
            {order.delivery_notes && (
              <p className="text-xs text-muted-foreground mt-1">
                Note: {order.delivery_notes}
              </p>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-6">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Delivery Progress</h4>
          <div className="flex items-center justify-between">
            {['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].map((status, index) => {
              const isActive = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].indexOf(order.delivery_status) >= index;
              const isCurrent = order.delivery_status === status;
              
              return (
                <div key={status} className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                    isCurrent ? "bg-primary border-primary text-white" :
                    isActive ? "bg-primary/20 border-primary text-primary" :
                    "bg-muted border-muted-foreground/20 text-muted-foreground"
                  )}>
                    {getStatusIcon(status)}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 text-center",
                    isCurrent ? "font-medium" : "text-muted-foreground"
                  )}>
                    {formatStatus(status)}
                  </span>
                  {index < 4 && (
                    <div className={cn(
                      "absolute w-16 h-0.5 mt-4 ml-8",
                      isActive ? "bg-primary" : "bg-muted-foreground/20"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-chat">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 bg-gradient-electric rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-xl">Order Tracking</h1>
                <p className="text-sm text-muted-foreground">Track your ElectroScoot orders</p>
              </div>
            </div>
            <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Customer Name *</Label>
                      <Input
                        id="customer_name"
                        value={newOrder.customer_name}
                        onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">Customer Phone</Label>
                      <Input
                        id="customer_phone"
                        value={newOrder.customer_phone}
                        onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_email">Customer Email</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={newOrder.customer_email}
                        onChange={(e) => setNewOrder({...newOrder, customer_email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Product Name *</Label>
                      <Select value={newOrder.product_name} onValueChange={(value) => setNewOrder({...newOrder, product_name: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ElectroScoot Lite">ElectroScoot Lite</SelectItem>
                          <SelectItem value="ElectroScoot Pro">ElectroScoot Pro</SelectItem>
                          <SelectItem value="ElectroScoot Max">ElectroScoot Max</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product_model">Product Model</Label>
                      <Select value={newOrder.product_model} onValueChange={(value) => setNewOrder({...newOrder, product_model: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ES-LITE-2024">ES-LITE-2024</SelectItem>
                          <SelectItem value="ES-PRO-2024">ES-PRO-2024</SelectItem>
                          <SelectItem value="ES-MAX-2024">ES-MAX-2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order_amount">Order Amount *</Label>
                      <Input
                        id="order_amount"
                        type="number"
                        step="0.01"
                        value={newOrder.order_amount}
                        onChange={(e) => setNewOrder({...newOrder, order_amount: e.target.value})}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated_delivery">Estimated Delivery Date</Label>
                      <Input
                        id="estimated_delivery"
                        type="date"
                        value={newOrder.estimated_delivery}
                        onChange={(e) => setNewOrder({...newOrder, estimated_delivery: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_status">Delivery Status</Label>
                      <Select value={newOrder.delivery_status} onValueChange={(value) => setNewOrder({...newOrder, delivery_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newOrder.delivery_status === 'delivered' && (
                      <div className="space-y-2">
                        <Label htmlFor="actual_delivery_date">Actual Delivery Date</Label>
                        <Input
                          id="actual_delivery_date"
                          type="date"
                          value={newOrder.actual_delivery_date}
                          onChange={(e) => setNewOrder({...newOrder, actual_delivery_date: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_address">Delivery Address *</Label>
                    <Textarea
                      id="delivery_address"
                      value={newOrder.delivery_address}
                      onChange={(e) => setNewOrder({...newOrder, delivery_address: e.target.value})}
                      placeholder="Enter delivery address"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_notes">Delivery Notes</Label>
                    <Textarea
                      id="delivery_notes"
                      value={newOrder.delivery_notes}
                      onChange={(e) => setNewOrder({...newOrder, delivery_notes: e.target.value})}
                      placeholder="Enter delivery notes (optional)"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setCreateOrderOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createOrder}
                      disabled={creating}
                    >
                      {creating ? "Creating..." : "Create Order"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Order by ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter order ID (e.g., ES-2024-001)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
                className="flex-1"
              />
              <Button 
                onClick={searchOrder} 
                disabled={searching}
                className="px-6"
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Result */}
        {searchResult && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Search Result</h2>
            <OrderCard order={searchResult} showCustomerInfo={true} />
          </div>
        )}

        {/* All Orders */}
        {userOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">All Orders</h2>
            <div className="space-y-4">
              {userOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* No Orders Message */}
        {userOrders.length === 0 && !searchResult && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any orders yet. When you place an order, it will appear here.
              </p>
              <p className="text-sm text-muted-foreground">
                You can also search for any order using the Order ID above.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
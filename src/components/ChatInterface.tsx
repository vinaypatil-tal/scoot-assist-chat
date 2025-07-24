import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Paperclip, 
  Battery, 
  MapPin, 
  Wrench, 
  AlertTriangle,
  Clock,
  Package,
  User,
  Bot,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'file' | 'quick-reply';
}

const PREDEFINED_QUESTIONS = [
  {
    id: 'battery',
    icon: Battery,
    title: 'Battery Issues',
    description: 'Charging, range, or battery health problems'
  },
  {
    id: 'location',
    icon: MapPin,
    title: 'Find My Scooter',
    description: 'Location tracking and GPS issues'
  },
  {
    id: 'maintenance',
    icon: Wrench,
    title: 'Maintenance',
    description: 'Service, repairs, and upkeep questions'
  },
  {
    id: 'delivery',
    icon: Package,
    title: 'Order Status',
    description: 'Track your delivery and order updates'
  },
  {
    id: 'safety',
    icon: AlertTriangle,
    title: 'Safety Concerns',
    description: 'Report safety issues or accidents'
  },
  {
    id: 'other',
    icon: Clock,
    title: 'Other Issues',
    description: 'Something else? We\'re here to help'
  }
];

const FAQ_DATABASE = {
  // Battery related FAQs
  battery: [
    {
      keywords: ['battery', 'charge', 'charging', 'power', 'not charging', 'slow charging', 'battery life', 'range'],
      question: "Battery and charging issues",
      answer: "For battery issues:\n\n• **Not charging**: Check if the charger is properly connected and the outlet is working. Try a different outlet.\n• **Slow charging**: Use only the original charger. Charging time is typically 4-6 hours.\n• **Short range**: Battery range decreases in cold weather and with heavy usage. A full charge should give 15-25 miles range.\n• **Battery won't hold charge**: After 2+ years, battery capacity naturally decreases. Contact us for battery replacement options.\n\n💡 **Tip**: Charge your scooter after each use and avoid completely draining the battery."
    },
    {
      keywords: ['battery replacement', 'new battery', 'battery warranty'],
      question: "Battery replacement and warranty",
      answer: "**Battery Warranty**: Our batteries are covered for 12 months or 300 charge cycles, whichever comes first.\n\n**Replacement Options**:\n• Genuine replacement batteries: $199-299\n• Installation service available for $50\n• DIY replacement kits include tools and instructions\n\n**To order**: Contact our support team with your scooter model and purchase date. We'll verify warranty status and process your order."
    }
  ],

  // Location and GPS FAQs
  location: [
    {
      keywords: ['gps', 'location', 'find', 'tracking', 'stolen', 'lost', 'app', 'bluetooth'],
      question: "GPS and location tracking",
      answer: "**GPS Tracking Issues**:\n\n• **Can't find scooter**: Ensure Bluetooth is enabled and you're within 30 feet. Check if scooter is powered on.\n• **Location not updating**: Force-close and restart the app. Make sure location permissions are enabled.\n• **Scooter stolen**: Report to police immediately, then contact us with your order number for insurance claim assistance.\n\n**App Requirements**:\n• Latest app version (check app store for updates)\n• Location permissions enabled\n• Bluetooth enabled on your phone"
    }
  ],

  // Maintenance FAQs
  maintenance: [
    {
      keywords: ['maintenance', 'service', 'tire', 'brake', 'cleaning', 'repair', 'tune-up', 'oil', 'parts'],
      question: "General maintenance and service",
      answer: "**Regular Maintenance Schedule**:\n\n**Weekly**:\n• Check tire pressure (recommended: 50 PSI)\n• Test brakes for proper function\n• Clean with damp cloth (avoid water near electrical components)\n\n**Monthly**:\n• Tighten bolts and screws\n• Lubricate folding mechanism\n• Check for wear on brake pads\n\n**Professional Service** (every 6 months):\n• Complete safety inspection\n• Brake adjustment\n• Tire replacement if needed\n\n📍 **Find Service**: Use our app to locate authorized service centers near you."
    },
    {
      keywords: ['tire puncture', 'flat tire', 'tire replacement', 'wheel'],
      question: "Tire and wheel issues",
      answer: "**Flat Tire Solutions**:\n\n**Temporary Fix**:\n• Small punctures can be repaired with our tire repair kit ($15)\n• Available at most bike shops\n\n**Tire Replacement**:\n• Front tire: $45 + installation\n• Rear tire: $55 + installation\n• Both tires: $85 + installation\n\n**DIY Installation**: We provide video tutorials and mail repair kits. Installation takes about 30 minutes with basic tools.\n\n⚠️ **Safety**: Don't ride on flat or damaged tires - it can damage the rim and motor."
    }
  ],

  // Safety FAQs
  safety: [
    {
      keywords: ['accident', 'injury', 'safety', 'helmet', 'lights', 'brakes', 'emergency'],
      question: "Safety and accident reporting",
      answer: "**Immediate Safety**:\n• If injured, seek medical attention first\n• Move to safety if possible\n• Document the incident with photos\n\n**Required Safety Gear**:\n• Helmet (required by law in most areas)\n• Front and rear lights for night riding\n• Reflective clothing recommended\n\n**Safety Features**:\n• Dual braking system (electronic + mechanical)\n• LED headlight and taillight\n• Bell for pedestrian alerts\n• Speed limiter in app settings\n\n**Report Incidents**: Contact our safety team at safety@electroscoot.com for incident reporting and insurance claims."
    }
  ],

  // Delivery and Order FAQs
  delivery: [
    {
      keywords: ['order', 'delivery', 'shipping', 'tracking', 'status', 'when will it arrive', 'delayed'],
      question: "Order status and delivery",
      answer: "**Delivery Timeline**:\n• Standard shipping: 3-5 business days\n• Express shipping: 1-2 business days\n• White glove delivery: 5-7 business days (includes setup)\n\n**Track Your Order**:\n• Check your email for tracking number\n• Use our app's 'Order Status' feature\n• Call customer service with your order number\n\n**Delivery Issues**:\n• Package damaged: Don't accept delivery, contact us immediately\n• Missing parts: We'll expedite replacements at no cost\n• Delayed delivery: We'll provide updated timeline and compensation if applicable"
    }
  ],

  // General FAQs
  general: [
    {
      keywords: ['speed', 'how fast', 'max speed', 'mph', 'acceleration'],
      question: "Speed and performance",
      answer: "**Speed Specifications**:\n• Maximum speed: 15.5 mph (25 km/h)\n• 0-15 mph acceleration: 4.5 seconds\n• Speed modes: Eco (8 mph), Normal (12 mph), Sport (15.5 mph)\n\n**Factors Affecting Speed**:\n• Rider weight (optimal: under 220 lbs)\n• Terrain (hills reduce top speed)\n• Battery level (lower battery = reduced performance)\n• Tire pressure (under-inflated tires slow you down)\n\n⚠️ **Legal Limits**: Check local laws - some areas have lower speed limits for e-scooters."
    },
    {
      keywords: ['weight', 'weight limit', 'how much', 'heavy', 'carry'],
      question: "Weight specifications",
      answer: "**Weight Limits**:\n• Maximum rider weight: 220 lbs (100 kg)\n• Scooter weight: 26.5 lbs (12 kg)\n• Additional cargo: Up to 20 lbs in front basket\n\n**Portability**:\n• Folds in 3 seconds\n• Carrying handle included\n• Fits in most car trunks\n• Can be carried on public transit\n\n**Performance Impact**: Heavier riders may experience reduced range and slower acceleration, especially on hills."
    },
    {
      keywords: ['water', 'rain', 'waterproof', 'wet', 'weather'],
      question: "Weather resistance and water protection",
      answer: "**Water Resistance**: IP54 rated - protected against splashing water\n\n**Safe in Light Rain**:\n• Light drizzle and puddles are OK\n• Avoid deep water and heavy rain\n• Never submerge or pressure wash\n\n**After Wet Rides**:\n• Dry the scooter thoroughly\n• Check electrical connections\n• Store in dry location\n\n**Winter Storage**:\n• Charge battery monthly during storage\n• Keep in temperature-controlled environment\n• Check tire pressure more frequently"
    }
  ]
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your ElectroScoot support assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const addMessage = (content: string, isUser: boolean, type: 'text' | 'file' | 'quick-reply' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const findBestFAQMatch = (userQuery: string): string => {
    const queryLower = userQuery.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Search through all FAQ categories
    Object.entries(FAQ_DATABASE).forEach(([category, faqs]) => {
      faqs.forEach(faq => {
        let score = 0;
        faq.keywords.forEach(keyword => {
          if (queryLower.includes(keyword.toLowerCase())) {
            score += keyword.length; // Longer keywords get more weight
          }
        });
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = faq;
        }
      });
    });

    if (bestMatch && bestScore > 0) {
      return bestMatch.answer;
    }

    // Fallback responses for common patterns
    if (queryLower.includes('help') || queryLower.includes('support')) {
      return "I'm here to help! You can ask me about:\n\n• Battery and charging issues\n• GPS and location tracking\n• Maintenance and repairs\n• Order status and delivery\n• Safety concerns\n• Speed and performance\n• Weather resistance\n\nJust type your question naturally, or click one of the quick options above!";
    }

    if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('hey')) {
      return "Hello! I'm your ElectroScoot support assistant. I can help you with battery issues, maintenance, GPS tracking, delivery status, and any other questions about your electric scooter. What can I help you with today?";
    }

    return "I understand you're looking for help, but I couldn't find a specific answer for that question. Could you try rephrasing it or be more specific? \n\nFor example:\n• 'My battery won't charge'\n• 'How do I track my scooter?'\n• 'When will my order arrive?'\n\nOr you can click one of the quick help options above!";
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    addMessage(inputMessage, true);
    const userQuery = inputMessage;
    setInputMessage("");
    
    // Find and provide FAQ response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response = findBestFAQMatch(userQuery);
      addMessage(response, false);
    }, 1500);
  };

  const handleQuickReply = (question: typeof PREDEFINED_QUESTIONS[0]) => {
    addMessage(`I need help with: ${question.title}`, true, 'quick-reply');
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let response = "";
      
      // Get specific FAQ responses for categories
      switch (question.id) {
        case 'battery':
          response = FAQ_DATABASE.battery[0].answer;
          break;
        case 'delivery':
          response = FAQ_DATABASE.delivery[0].answer;
          break;
        case 'location':
          response = FAQ_DATABASE.location[0].answer;
          break;
        case 'maintenance':
          response = FAQ_DATABASE.maintenance[0].answer;
          break;
        case 'safety':
          response = FAQ_DATABASE.safety[0].answer;
          break;
        default:
          response = "I'm here to help with your scooter questions! Could you provide more details about your specific issue? You can also type your question naturally and I'll find the best answer for you.";
      }
      
      addMessage(response, false);
    }, 1500);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addMessage(`📎 Uploaded: ${file.name}`, true, 'file');
      
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage("Thank you for uploading the file! I've received it and our support team will review it to better assist you.", false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-chat flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-electric rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">ElectroScoot Support</h2>
                <p className="text-sm text-muted-foreground">Online • Usually replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                Live Chat
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

      {/* Quick Questions Section */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <h3 className="text-lg font-medium mb-4">How can we help you today?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PREDEFINED_QUESTIONS.map((question) => {
            const IconComponent = question.icon;
            return (
              <Card 
                key={question.id}
                className="cursor-pointer hover:shadow-soft transition-all duration-300 hover:scale-105 border-border/50"
                onClick={() => handleQuickReply(question)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-electric-soft rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{question.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{question.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-4">
        <div className="space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.isUser 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-gradient-electric text-white"
              )}>
                {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[70%] px-4 py-3 rounded-2xl",
                message.isUser
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-white shadow-soft rounded-bl-md",
                message.type === 'file' && "bg-accent/10 border border-accent/20"
              )}>
                <div className="text-sm whitespace-pre-line">{message.content}</div>
                <p className={cn(
                  "text-xs mt-1 opacity-70",
                  message.isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-electric flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white shadow-soft px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-border shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFileUpload}
              className="flex-shrink-0 h-10 w-10 hover:bg-accent/10"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="pr-12 h-12 rounded-xl border-border/50 focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 hover:bg-primary hover:text-primary-foreground"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx"
      />
    </div>
  );
}
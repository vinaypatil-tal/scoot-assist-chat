import { useState, useRef, useEffect } from "react";
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
  LogOut,
  MessageSquareMore,
  Settings,
  Zap,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'file' | 'quick-reply';
  fileUrl?: string;
  fileName?: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showManualReview, setShowManualReview] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user and load chat history
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Get user profile for phone number
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(profile);
        
        // Check if user is admin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        
        setIsAdmin(roles && roles.length > 0);
        
        // Load chat history
        await loadChatHistory(user.id);
        
        // Add welcome message if no chat history
        const { data: existingMessages } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (!existingMessages || existingMessages.length === 0) {
          await saveMessageToDatabase(
            "Hi! I'm your ElectroScoot support assistant. How can I help you today?",
            false,
            'text',
            user.id,
            profile?.phone_number
          );
          await loadChatHistory(user.id);
        }
      }
    };

    getCurrentUser();
  }, []);

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

  const loadChatHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      const loadedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        content: msg.message_content,
        isUser: msg.is_user_message,
        timestamp: new Date(msg.created_at),
        type: msg.message_type as 'text' | 'file' | 'quick-reply',
        fileUrl: msg.file_url || undefined,
        fileName: msg.file_name || undefined
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveMessageToDatabase = async (
    content: string, 
    isUser: boolean, 
    type: 'text' | 'file' | 'quick-reply',
    userId: string,
    phoneNumber?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
    fileSize?: number
  ) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          message_content: content,
          message_type: type,
          is_user_message: isUser,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize
        });

      if (error) {
        console.error('Error saving message:', error);
        toast({
          title: "Error",
          description: "Failed to save message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  const addMessage = async (content: string, isUser: boolean, type: 'text' | 'file' | 'quick-reply' = 'text', fileUrl?: string, fileName?: string) => {
    if (!user) return;

    // Save to database
    await saveMessageToDatabase(
      content,
      isUser,
      type,
      user.id,
      userProfile?.phone_number,
      fileUrl,
      fileName
    );

    // Reload chat history to show the new message
    await loadChatHistory(user.id);
  };

  const submitForManualReview = async (messageId: string, userFeedback?: string) => {
    if (!user) return;

    try {
      // Find the user message and bot response
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const userMessage = messages[messageIndex];
      const botResponse = messages[messageIndex + 1];

      // Get some chat context (last few messages)
      const contextMessages = messages.slice(Math.max(0, messageIndex - 2), messageIndex + 2);
      const chatContext = contextMessages.map(m => 
        `${m.isUser ? 'User' : 'Bot'}: ${m.content}`
      ).join('\n\n');

      const { error } = await supabase
        .from('manual_review_requests')
        .insert({
          user_id: user.id,
          phone_number: userProfile?.phone_number,
          original_query: userMessage.content,
          chat_context: chatContext,
          chatbot_response: botResponse?.content || 'No bot response',
          user_feedback: userFeedback || 'User requested manual review'
        });

      if (error) {
        console.error('Error submitting manual review:', error);
        toast({
          title: "Error",
          description: "Failed to submit for manual review",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Submitted for Review",
        description: "Your query has been submitted for manual review. Our team will get back to you soon!",
      });

      setShowManualReview(null);
    } catch (error) {
      console.error('Error submitting manual review:', error);
      toast({
        title: "Error",
        description: "An error occurred while submitting for review",
        variant: "destructive",
      });
    }
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;
    
    await addMessage(inputMessage, true);
    const userQuery = inputMessage;
    setInputMessage("");
    
    // Find and provide FAQ response
    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);
      const response = findBestFAQMatch(userQuery);
      await addMessage(response, false);
    }, 1500);
  };

  const handleQuickReply = async (question: typeof PREDEFINED_QUESTIONS[0]) => {
    if (!user) return;
    
    await addMessage(`I need help with: ${question.title}`, true, 'quick-reply');
    
    setIsTyping(true);
    setTimeout(async () => {
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
      
      await addMessage(response, false);
    }, 1500);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image (JPEG, PNG, GIF, WebP) or document (PDF, DOC, DOCX)",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      // Create file preview for images
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        await addMessage(`📷 ${file.name}`, true, 'file', publicUrl, file.name);
        
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          await addMessage("I can see your image! Our support team will review it and provide assistance based on what's shown. Is there anything specific about this image you'd like me to help with?", false);
        }, 1500);
      } else {
        // For documents, show file info
        const fileSize = (file.size / 1024).toFixed(1);
        await addMessage(`📄 ${file.name}\nSize: ${fileSize} KB\nType: ${file.type.split('/')[1].toUpperCase()}`, true, 'file', publicUrl, file.name);
        
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          await addMessage("Thank you for uploading the document! Our support team will review it to better assist you. Please describe what specific help you need so we can provide the most relevant assistance.", false);
        }, 1500);
      }

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      });
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-chat">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-border/50 shadow-soft sticky top-0 z-40">
        <div className="container-desktop py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="icon-container animate-electric-pulse">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-gradient-electric">
                  ElectroScoot Support
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Online • Lightning fast replies
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-gradient-success text-white border-0 shadow-soft hover-glow px-3 py-1.5 font-medium"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Live Chat
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/faq")}
                className="h-9 px-4 hover:bg-primary/10 hover:text-primary transition-smooth font-medium"
                title="Frequently Asked Questions"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">FAQ</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/orders")}
                className="h-9 px-4 hover:bg-accent/10 hover:text-accent transition-smooth font-medium"
                title="Track Orders"
              >
                <Package className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Orders</span>
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="h-9 px-4 hover:bg-primary/10 hover:text-primary transition-smooth font-medium"
                  title="Admin Dashboard"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-smooth"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions Section */}
      <div className="container-desktop py-8">
        <div className="text-center mb-8">
          <h3 className="font-display font-bold text-2xl mb-3 text-gradient-electric">
            How can we help you today?
          </h3>
          <p className="text-muted-foreground font-medium">
            Choose a category or type your question naturally
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREDEFINED_QUESTIONS.map((question) => {
            const IconComponent = question.icon;
            return (
              <Card 
                key={question.id}
                className="group cursor-pointer hover-lift transition-smooth border-0 bg-white/50 backdrop-blur-sm shadow-soft hover:shadow-electric"
                onClick={() => handleQuickReply(question)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="icon-container-sm group-hover:scale-110 transition-transform">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                        {question.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {question.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 container-desktop pb-8">
        <div className="space-y-6 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4 animate-slide-up",
                message.isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-soft",
                message.isUser 
                  ? "bg-gradient-accent" 
                  : "bg-gradient-electric"
              )}>
                {message.isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className={cn(
                "max-w-[75%] sm:max-w-[70%] px-6 py-4 rounded-2xl relative group shadow-soft transition-smooth",
                message.isUser
                  ? "bg-gradient-accent text-white rounded-br-lg ml-auto"
                  : "bg-white/80 backdrop-blur-sm rounded-bl-lg border border-border/20",
                message.type === 'file' && "bg-white/90 border-2 border-accent/20"
              )}>
                <div className="text-sm leading-relaxed font-medium">
                  {message.type === 'file' && message.fileUrl && message.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="space-y-3">
                      <div>{message.content}</div>
                      <img 
                        src={message.fileUrl} 
                        alt={message.fileName || "Uploaded file"} 
                        className="max-w-full h-auto rounded-xl border border-border/30 max-h-64 object-contain shadow-soft"
                      />
                    </div>
                  ) : message.type === 'file' && message.fileUrl ? (
                    <div className="space-y-3">
                      <div>{message.content}</div>
                      <a 
                        href={message.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-dark underline transition-colors font-medium"
                      >
                        <Paperclip className="w-4 h-4" />
                        View File
                      </a>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                
                {/* Manual Review Button - only show for bot responses */}
                {!message.isUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualReview(message.id)}
                    className="absolute -bottom-10 right-0 opacity-0 group-hover:opacity-100 transition-all text-xs h-8 px-3 bg-white/90 backdrop-blur-sm shadow-soft border border-border/30 hover:bg-accent/50 hover:border-accent rounded-full"
                  >
                    <MessageSquareMore className="w-3 h-3 mr-1" />
                    Need Help?
                  </Button>
                )}
                
                <p className={cn(
                  "text-xs mt-3 opacity-75 font-medium",
                  message.isUser ? "text-white/80" : "text-muted-foreground"
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

        {/* Manual Review Modal */}
        {showManualReview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Request Manual Review</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Not satisfied with the answer? Our support team will review your question and provide a personalized response.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => submitForManualReview(showManualReview, "Answer not helpful")}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">Answer not helpful</div>
                    <div className="text-xs text-muted-foreground">The response didn't solve my problem</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => submitForManualReview(showManualReview, "Need more specific help")}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">Need more specific help</div>
                    <div className="text-xs text-muted-foreground">My situation is unique and needs personal attention</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => submitForManualReview(showManualReview, "Technical issue")}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">Technical issue</div>
                    <div className="text-xs text-muted-foreground">I need technical support from an expert</div>
                  </div>
                </Button>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowManualReview(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => submitForManualReview(showManualReview)}
                  className="flex-1"
                >
                  Submit for Review
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white/80 backdrop-blur-md border-t border-border/50 shadow-soft sticky bottom-0 z-40">
        <div className="container-desktop py-6">
          <div className="flex items-end gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFileUpload}
              className="flex-shrink-0 h-12 w-12 hover:bg-accent/10 hover:text-accent transition-smooth rounded-xl shadow-soft bg-white/50"
              title="Upload File"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="h-14 pr-16 rounded-2xl border-border/30 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-soft font-medium placeholder:text-muted-foreground/70 transition-smooth"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 top-2 h-10 w-10 p-0 bg-gradient-electric hover:bg-gradient-electric shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                title="Send Message"
              >
                <Send className="w-5 h-5" />
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
        accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx"
      />
    </div>
  );
}
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
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    addMessage(inputMessage, true);
    setInputMessage("");
    
    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage("Thanks for your message! I'm processing your request and will get back to you shortly.", false);
    }, 1500);
  };

  const handleQuickReply = (question: typeof PREDEFINED_QUESTIONS[0]) => {
    addMessage(`I need help with: ${question.title}`, true, 'quick-reply');
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let response = "";
      
      switch (question.id) {
        case 'battery':
          response = "I understand you're having battery issues. Can you tell me more about the specific problem? Is it not charging, losing charge quickly, or something else?";
          break;
        case 'delivery':
          response = "I'd be happy to check your order status! Could you please provide your order number or the email address you used when placing the order?";
          break;
        case 'location':
          response = "For location and GPS issues, please make sure your scooter's Bluetooth is enabled and you have the latest version of our app. Can you tell me what specific issue you're experiencing?";
          break;
        default:
          response = `Thanks for selecting ${question.title}. Could you provide more details about your specific issue so I can assist you better?`;
      }
      
      addMessage(response, false);
    }, 2000);
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
            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
              Live Chat
            </Badge>
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
                <p className="text-sm">{message.content}</p>
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
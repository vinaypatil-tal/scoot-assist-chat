import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <ChatInterface />;
};

export default Index;

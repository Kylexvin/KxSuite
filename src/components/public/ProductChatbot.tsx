"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./ProductChatbot.module.css";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

type Product = {
  name: string;
  tagline: string;
  description: string;
  features: Array<{ title: string; description: string }>;
  benefits: string[];
  faqs: Array<{ question: string; answer: string }>;
  status: string;
  slug: string;
};

// Bot response logic
function getBotResponse(message: string, product: Product): string {
  const lower = message.toLowerCase();

  // Product info
  if (lower.includes("what") && (lower.includes("product") || lower.includes("this"))) {
    return `${product.name} is ${product.tagline}. ${product.description}`;
  }

  // Features
  if (lower.includes("feature") || lower.includes("can it") || lower.includes("does it")) {
    const features = product.features.slice(0, 3);
    return `Here are some key features:\n${features.map(f => `- ${f.title}: ${f.description}`).join('\n')}\n\nWould you like to know more about any specific feature?`;
  }

  // Pricing
  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return `${product.name} pricing starts from KSh 2,500 per month. We have flexible plans for businesses of all sizes. Would you like to see our full pricing breakdown?`;
  }

  // Benefits
  if (lower.includes("benefit") || lower.includes("help") || lower.includes("advantage")) {
    const benefits = product.benefits.slice(0, 3);
    return `Here's how ${product.name} can help:\n${benefits.map(b => `- ${b}`).join('\n')}\n\nAny specific challenge you're trying to solve?`;
  }

  // Offline
  if (lower.includes("offline") || lower.includes("internet") || lower.includes("online")) {
    return `${product.name} works offline. All sales and data are saved locally and sync automatically when you're back online. Perfect for areas with unreliable internet.`;
  }

  // Demo
  if (lower.includes("demo") || lower.includes("see it") || lower.includes("show me")) {
    return `You can view a demo of ${product.name} by clicking the "View Demo" button above. Would you like me to walk you through what you'll see in the demo?`;
  }

  // Support
  if (lower.includes("support") || lower.includes("help") || lower.includes("assist")) {
    return `We're here to help. You can reach us at:\n- Email: support@kxbyte.com\n- Phone: +254 700 123 456\n- Live Chat: Click the chat icon on our website\n\nIs there anything specific I can help you with?`;
  }

  // Status
  if (lower.includes("available") || lower.includes("launch") || lower.includes("when")) {
    if (product.status === "live") {
      return `${product.name} is live and available now. You can get started today by clicking the "Get Started" button.`;
    }
    return `${product.name} is coming soon. Join our waitlist to be the first to know when we launch.`;
  }

  // Owner perspective
  if (lower.includes("owner") || lower.includes("business owner") || lower.includes("run my business")) {
    return `As a business owner, ${product.name} will help you:\n- Save time with automation\n- Make better decisions with real-time data\n- Grow your business with customer insights\n- Reduce costs with efficient operations\n\nWhat type of business do you run? I can tell you how ${product.name} specifically helps businesses like yours.`;
  }

  // Customer perspective
  if (lower.includes("customer") || lower.includes("client") || lower.includes("customer experience")) {
    return `Your customers will benefit from:\n- Fast checkout experience\n- Professional receipts and invoices\n- Consistent service with inventory tracking\n- Better communication with CRM tools\n\n${product.name} is designed to improve both your operations and your customer experience.`;
  }

  // Default responses
  const defaultResponses = [
    `That's a great question about ${product.name}. Let me help you understand how this works.`,
    `I'd be happy to explain more about ${product.name}. What specific aspect are you interested in?`,
    `${product.name} is designed to make your business operations smoother. Let me share more details.`,
    `Great question. ${product.name} handles this by providing you with intuitive tools and real-time insights.`
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export default function ProductChatbot({ product }: { product: Product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hi. I'm your ${product.name} assistant. Ask me anything about the product, pricing, features, or how it can help your business.`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(input, product);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600 + Math.random() * 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What is this product?",
    "How much does it cost?",
    "What are the main features?",
    "Does it work offline?",
    "How can it help my business?",
  ];

  return (
    <>
      <button
        className={styles.chatToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? "✕" : "💬"}
        {!isOpen && <span className={styles.badge}>Ask me</span>}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.chatIcon}>AI</span>
              <div>
                <h3>{product.name} Assistant</h3>
                <span className={styles.chatStatus}>Online</span>
              </div>
            </div>
            <button
              className={styles.chatClose}
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.sender === "user" ? styles.user : styles.bot
                }`}
              >
                <div className={styles.messageContent}>
                  {message.sender === "bot" && (
                    <span className={styles.avatar}>AI</span>
                  )}
                  <div className={styles.messageText}>
                    <p>{message.text}</p>
                    <span className={styles.timestamp}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={styles.messageContent}>
                  <span className={styles.avatar}>AI</span>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.quickQuestions}>
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                className={styles.quickQuestion}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => handleSend(), 100);
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div className={styles.chatInput}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about features, pricing, support..."
              rows={1}
              className={styles.input}
            />
            <button
              onClick={handleSend}
              className={styles.sendButton}
              disabled={!input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
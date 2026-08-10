export type Product = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  longDescription: string;
  logo: string;
  status: "live" | "soon";
  features: Array<{ title: string; description: string }>;
  benefits: string[];
  faqs: Array<{ question: string; answer: string }>;
  demoUrl?: string;
  ready: boolean;
};

export const products: Record<string, Product> = {
  kxtill: {
    name: "KxTill",
    slug: "kxtill",
    tagline: "Point of Sale & Inventory Management",
    description: "Run your retail business with a complete POS system.",
    longDescription: `
      KxTill is designed for businesses that need a reliable, fast, and easy-to-use point of sale system. 
      Whether you're running a boutique, restaurant, or pharmacy, KxTill helps you manage sales, inventory, 
      and customer relationships all in one place.
    `,
    logo: "/assets/logo.png",
    status: "live",
    features: [
      { title: "Point of Sale", description: "Fast, intuitive checkout with multiple payment methods" },
      { title: "Inventory Management", description: "Real-time stock tracking and low stock alerts" },
      { title: "Sales Analytics", description: "Understand your business with detailed reports" },
      { title: "Smart Receipts", description: "Professional receipts with your branding" },
      { title: "Customer Management", description: "Track customer preferences and purchase history" },
      { title: "Offline Mode", description: "Keep selling even without internet connection" },
    ],
    benefits: [
      "Increase revenue with data-driven insights",
      "Reduce stockouts with real-time inventory tracking",
      "Save time with automated reporting",
      "Grow your business with customer insights",
      "Work anywhere with offline capability",
      "Secure and reliable - your data is safe"
    ],
    faqs: [
      { question: "Do I need internet to use KxTill?", answer: "No. KxTill works offline and syncs automatically when you're back online." },
      { question: "Can I use KxTill on multiple devices?", answer: "Yes. KxTill works across desktop, tablet, and mobile devices." },
      { question: "How does inventory tracking work?", answer: "Every sale automatically updates your inventory. You get alerts when stock is low." },
      { question: "Is my data secure?", answer: "Absolutely. We use enterprise-grade encryption and never share your data." },
      { question: "What payment methods does KxTill support?", answer: "KxTill supports cash, mobile money (M-Pesa), and card payments." },
      { question: "Can I track multiple stores?", answer: "Yes. KxTill supports multi-store management with centralized reporting." }
    ],
    demoUrl: "https://demo.kxbyte.com/kxtill",
    ready: true,
  },
  kxinvoice: {
    name: "KxInvoice",
    slug: "kxinvoice",
    tagline: "Invoicing & Payments Made Simple",
    description: "Create professional invoices and get paid faster.",
    longDescription: `
      KxInvoice helps businesses create professional invoices in seconds. Send payment reminders, 
      track payments, and get paid faster with automated follow-ups.
    `,
    logo: "/assets/logo.png",
    status: "soon",
    features: [
      { title: "Professional Invoicing", description: "Beautiful, branded invoices in seconds" },
      { title: "Payment Tracking", description: "Know exactly who has paid and who hasn't" },
      { title: "Automated Reminders", description: "Never chase payments again" },
      { title: "Financial Reports", description: "Understand your cash flow at a glance" },
      { title: "Multiple Currencies", description: "Invoice in your customers' currency" },
      { title: "Tax Ready", description: "Automatic tax calculations for compliance" },
    ],
    benefits: [
      "Get paid 30% faster with automated reminders",
      "Reduce errors with smart invoice templates",
      "Save hours with recurring invoices",
      "Track all payments in one dashboard",
      "Professional branding with your logo",
      "Secure payment processing"
    ],
    faqs: [
      { question: "When will KxInvoice be available?", answer: "We're launching soon. Join the waitlist to be notified." },
      { question: "Can I customize my invoices?", answer: "Yes. Add your logo, colors, and custom fields." },
      { question: "Does KxInvoice support M-Pesa?", answer: "Yes. KxInvoice integrates with M-Pesa for seamless payments." }
    ],
    ready: false,
  },
  kxcrm: {
    name: "KxCRM",
    slug: "kxcrm",
    tagline: "Customer Relationship Management",
    description: "Build better customer relationships.",
    longDescription: `
      KxCRM helps you build stronger customer relationships. Track leads, manage follow-ups, 
      and get insights to grow your business.
    `,
    logo: "/assets/logo.png",
    status: "soon",
    features: [
      { title: "Lead Management", description: "Track every lead from first contact to conversion" },
      { title: "Contact Database", description: "Centralize all customer information" },
      { title: "Follow-up Tracking", description: "Never miss a follow-up with smart reminders" },
      { title: "Pipeline Management", description: "See where every deal stands" },
      { title: "Activity Logs", description: "Complete history of every customer interaction" },
      { title: "Insights & Analytics", description: "Data-driven decisions for your business" },
    ],
    benefits: [
      "Never miss a follow-up with automated reminders",
      "Understand your customers with insights",
      "Close more deals with pipeline management",
      "Centralize all customer data",
      "Improve customer retention",
      "Grow your business intelligently"
    ],
    faqs: [
      { question: "Can I import my existing contacts?", answer: "Yes. We support CSV import and integration with Google Contacts." },
      { question: "Does KxCRM integrate with KxTill?", answer: "Yes. All KXBYTE products work together seamlessly." },
      { question: "Can I track customer interactions?", answer: "Yes. KxCRM logs every interaction automatically." }
    ],
    ready: false,
  },
};

export function getProduct(slug: string): Product | undefined {
  return products[slug];
}

export function getAllProducts(): Product[] {
  return Object.values(products);
}

export function getLiveProducts(): Product[] {
  return Object.values(products).filter(p => p.status === "live");
}
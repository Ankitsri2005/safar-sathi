"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui/Button";
import { ChevronDown, HelpCircle, ArrowRight, MessageCircle, Search } from "lucide-react";
import { cn } from "@/utils/cn";

const faqCategories = [
  {
    category: "General",
    questions: [
      {
        q: "What is the Smart Tourist Safety System?",
        a: "It's a comprehensive government platform designed to ensure tourist safety across India. It combines blockchain-secured digital identities, AI-powered anomaly detection, real-time GPS monitoring, and instant emergency response coordination to create a safety net for all tourists.",
      },
      {
        q: "Who can use this system?",
        a: "Any domestic or international tourist visiting India can register for a Digital Tourist ID. Authority users (police officers, tourism department officials) have access to the monitoring dashboard. The system is available in 12+ Indian languages.",
      },
      {
        q: "Is the system free to use?",
        a: "Yes, the system is completely free for all tourists. It is a government-funded initiative under the Ministry of Tourism to enhance tourist safety across India.",
      },
      {
        q: "In which languages is the system available?",
        a: "The system supports English, Hindi, Bengali, Tamil, Telugu, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Odia, and Assamese. We continuously work to add more languages.",
      },
    ],
  },
  {
    category: "Registration & Digital ID",
    questions: [
      {
        q: "How do I register for a Digital Tourist ID?",
        a: "Visit our registration page, fill in your personal details, ID information, emergency contacts, and travel itinerary. Once submitted, you'll receive a blockchain-secured Digital Tourist ID with a unique QR code within minutes.",
      },
      {
        q: "What documents do I need to register?",
        a: "You'll need a valid government-issued ID (Aadhaar, Passport, or other national ID), a phone number, email address, and your travel itinerary details including dates and destinations.",
      },
      {
        q: "How long is my Digital Tourist ID valid?",
        a: "Your Digital Tourist ID is valid for the duration of your registered trip. You can extend it through the system if your travel plans change. Expired IDs can be renewed with updated itinerary information.",
      },
      {
        q: "Can I verify someone else's Digital Tourist ID?",
        a: "Yes. Anyone can verify a Digital Tourist ID using the verification page by scanning the QR code or entering the Tourist ID and Block ID. This confirms the ID's authenticity on the blockchain.",
      },
    ],
  },
  {
    category: "Safety & Monitoring",
    questions: [
      {
        q: "How does the panic button work?",
        a: "When you press the panic button in the app, it immediately sends an emergency alert with your GPS location to the nearest police station, tourism help center, and your emergency contacts. Response teams are dispatched within 30 seconds.",
      },
      {
        q: "How does real-time tracking work?",
        a: "When your Digital Tourist ID is active, the system monitors your GPS location to ensure your safety. Authorities can view a live dashboard of tourist locations. This data is encrypted and automatically deleted after 90 days.",
      },
      {
        q: "What happens when I enter a restricted zone?",
        a: "If you enter a restricted or high-risk zone, you'll receive an automatic warning notification. Authorities will also be alerted to monitor the situation. You can choose to continue or follow recommended safe routes.",
      },
      {
        q: "How does AI anomaly detection work?",
        a: "Machine learning algorithms analyze your movement patterns against your registered itinerary. Unusual deviations, prolonged inactivity, or other anomalies trigger early warning alerts to authorities for proactive safety checks.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Who can see my location data?",
        a: "Only authorized police and tourism safety personnel can access location data, and only during active safety monitoring. Your data is encrypted, and access is logged and audited. Location data is automatically deleted after 90 days.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. All data is encrypted using AES-256 encryption. Your identity is stored on a blockchain ledger, making it tamper-proof. We undergo regular security audits and comply with the Digital Personal Data Protection Act, 2023.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. You can request account deletion at any time. All personal data is permanently removed within 30 days. Blockchain identity records remain on the distributed ledger for verification purposes as required by law.",
      },
      {
        q: "Does the government sell my data?",
        a: "Absolutely not. We do NOT sell, rent, or share personal data with any third-party commercial entities. Data is only shared with authorized safety personnel for emergency response purposes.",
      },
    ],
  },
];

export default function FAQPage() {
  const { t } = useLanguage();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allQuestions = faqCategories.flatMap((cat) =>
    cat.questions.map((q) => ({ ...q, category: cat.category }))
  );

  const filteredQuestions = searchQuery
    ? allQuestions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface via-primary-dark to-surface pt-28 pb-16">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-primary-light" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t("faq_title")}</h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              {t("faq_subtitle")}
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Search */}
      <section className="py-8 bg-bg border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/50"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 bg-bg">
        <div className="max-w-3xl mx-auto px-4">
          {filteredQuestions ? (
            <div className="space-y-4">
              <p className="text-sm text-muted mb-4">{filteredQuestions.length} results found</p>
              {filteredQuestions.map((item, i) => {
                const id = `search-${i}`;
                const isOpen = openItems.includes(id);
                return (
                  <div key={id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div>
                        <span className="text-[10px] text-accent font-medium uppercase tracking-wider">{item.category}</span>
                        <p className="text-sm font-medium text-fg mt-0.5">{item.q}</p>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-muted shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                    </button>
                    <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0")}>
                      <p className="px-5 pb-4 text-sm text-muted leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-10">
              {faqCategories.map((cat, ci) => (
                <AnimateOnScroll key={cat.category} delay={ci * 80}>
                  <div>
                    <h2 className="text-lg font-semibold text-fg mb-4 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-accent" />
                      {cat.category}
                    </h2>
                    <div className="space-y-3">
                      {cat.questions.map((item, i) => {
                        const id = `${cat.category}-${i}`;
                        const isOpen = openItems.includes(id);
                        return (
                          <div key={id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                            <button
                              onClick={() => toggle(id)}
                              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                              <p className="text-sm font-medium text-fg">{item.q}</p>
                              <ChevronDown className={cn("w-4 h-4 text-muted shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                            </button>
                            <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0")}>
                              <p className="px-5 pb-4 text-sm text-muted leading-relaxed">{item.a}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 bg-surface-light/5 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-fg mb-2">Still Have Questions?</h2>
            <p className="text-muted mb-6">Our support team is available 24/7 to help you.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="tel:1363">
                <Button variant="primary" iconRight={<ArrowRight className="w-4 h-4" />}>
                  Call Tourist Helpline: 1363
                </Button>
              </a>
              <Link href="/emergency">
                <Button variant="outline">
                  View All Emergency Contacts
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </div>
  );
}

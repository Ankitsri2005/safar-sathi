"use client";

import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Phone,
  Eye,
  Lock,
  Backpack,
  Sun,
  Cloud,
  Navigation,
  CheckCircle,
  ArrowRight,
  Hotel,
  Car,
  Users,
} from "lucide-react";

const safetyTips = [
  {
    category: "Before You Travel",
    icon: Backpack,
    color: "bg-primary/10 text-primary",
    tips: [
      "Register on the Smart Tourist Safety portal and obtain your Digital Tourist ID",
      "Share your travel itinerary with family, friends, and the tourism department",
      "Save emergency numbers (112, 1363) in your phone and keep physical copies",
      "Research your destination — understand local customs, laws, and safe areas",
      "Ensure your phone is charged and carry a portable power bank",
      "Purchase comprehensive travel insurance covering medical emergencies",
    ],
  },
  {
    category: "While Traveling",
    icon: Navigation,
    color: "bg-accent/10 text-accent",
    tips: [
      "Keep your Digital Tourist ID accessible at all times for verification",
      "Stay in well-lit, populated areas, especially after dark",
      "Use only registered taxis and transportation services",
      "Avoid displaying expensive jewelry, electronics, or large amounts of cash",
      "Keep digital and physical copies of important documents separately",
      "Trust your instincts — if something feels wrong, leave the area immediately",
    ],
  },
  {
    category: "Digital Safety",
    icon: Lock,
    color: "bg-success/10 text-success",
    tips: [
      "Never share your Digital ID credentials or QR codes with unauthorized persons",
      "Verify the identity of anyone requesting access to your Digital ID",
      "Use the official app only — avoid third-party apps claiming to provide the same service",
      "Report lost or stolen devices immediately to activate remote ID protection",
      "Keep your emergency contact information updated in the system",
      "Enable location services for the safety app to ensure authorities can locate you",
    ],
  },
  {
    category: "Emergency Situations",
    icon: AlertTriangle,
    color: "bg-danger/10 text-danger",
    tips: [
      "Press the panic button in the app for immediate emergency response",
      "Call 112 (National Emergency) or 1363 (Tourist Helpline) for direct assistance",
      "Move to a safe, public location if you feel threatened",
      "Stay calm and provide your exact location to emergency responders",
      "Do not resist if threatened — your safety is the top priority",
      "Report incidents as soon as possible for faster response and investigation",
    ],
  },
];

const weatherSafety = [
  { icon: Sun, title: "Summer (Mar-Jun)", tips: "Carry water, wear sunscreen, avoid midday travel. Stay hydrated in temperatures exceeding 40°C." },
  { icon: Cloud, title: "Monsoon (Jul-Sep)", tips: "Avoid flood-prone areas, carry rain gear, check road conditions. Landslide risks in hilly regions." },
  { icon: Cloud, title: "Winter (Oct-Feb)", tips: "Carry warm clothing for northern regions, watch for fog delays, carry emergency blankets." },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface via-success-dark to-surface pt-28 pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-success/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-success-light" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Safety Instructions</h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Essential guidelines to ensure a safe and memorable journey across India.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Safety Tips */}
      <section className="py-20 bg-bg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="space-y-12">
            {safetyTips.map((section, si) => {
              const Icon = section.icon;
              return (
                <AnimateOnScroll key={section.category} delay={si * 100}>
                  <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-semibold text-fg">{section.category}</h2>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3">
                        {section.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted">
                            <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Weather Safety */}
      <section className="py-16 bg-surface-light/5">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Weather</span>
              <h2 className="text-3xl font-bold text-fg mt-2">Seasonal Safety Tips</h2>
            </div>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-6">
            {weatherSafety.map((w, i) => (
              <AnimateOnScroll key={w.title} delay={i * 100}>
                <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all h-full">
                  <w.icon className="w-8 h-8 text-accent mb-3" />
                  <h3 className="font-semibold text-fg mb-2">{w.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{w.tips}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Emergency */}
      <section className="py-12 bg-danger-50 border-y border-danger-100">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-danger" />
            <div>
              <p className="font-semibold text-fg">Need immediate help?</p>
              <p className="text-sm text-muted">Call our 24/7 emergency helplines</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="tel:112" className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger-dark transition-colors">
              Emergency: 112
            </a>
            <a href="tel:1363" className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              Tourist Helpline: 1363
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

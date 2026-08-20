"use client";

import Footer from "@/components/layout/Footer";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { FileText, Scale, Shield, AlertTriangle, UserCheck, Globe, Gavel } from "lucide-react";

const sections = [
  {
    title: "Acceptance of Terms",
    icon: FileText,
    content: [
      "By accessing or using the Smart Tourist Safety Monitoring & Incident Response System, you agree to be bound by these Terms and Conditions.",
      "If you do not agree to these terms, you must not access or use the system.",
      "The Government of India reserves the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.",
      "These terms are governed by the laws of India, and any disputes shall be subject to the jurisdiction of Indian courts.",
    ],
  },
  {
    title: "Eligibility",
    icon: UserCheck,
    content: [
      "The system is available to all domestic and international tourists visiting India.",
      "Authority users (police, tourism department) must be authorized government personnel.",
      "Users must be at least 18 years of age, or have parental/guardian consent to register.",
      "Each individual may maintain only one active Digital Tourist ID at any time.",
    ],
  },
  {
    title: "User Responsibilities",
    icon: Shield,
    content: [
      "You must provide accurate, current, and complete information during registration.",
      "You are responsible for maintaining the confidentiality of your Digital ID credentials.",
      "You must immediately report any unauthorized use of your Digital ID or security breaches.",
      "You must keep your emergency contact information and travel itinerary up to date.",
      "You must not share, transfer, or allow others to use your Digital Tourist ID.",
      "You must comply with all applicable laws and regulations during your stay in India.",
    ],
  },
  {
    title: "Prohibited Activities",
    icon: AlertTriangle,
    content: [
      "Attempting to forge, duplicate, or tamper with Digital Tourist IDs or blockchain records.",
      "Using the system for any illegal, fraudulent, or unauthorized purpose.",
      "Interfering with or disrupting the system's infrastructure or security measures.",
      "Attempting to gain unauthorized access to other users' data or system components.",
      "Transmitting malware, viruses, or any other harmful code through the system.",
      "Misusing emergency alert features for non-emergency situations.",
    ],
  },
  {
    title: "Limitation of Liability",
    icon: Scale,
    content: [
      "The system is provided on an 'as is' and 'as available' basis without warranties of any kind.",
      "While we strive for 24/7 availability, the Government of India does not guarantee uninterrupted service.",
      "Emergency response times may vary based on location, weather, and operational conditions.",
      "The system is a supplementary safety tool and does not replace standard law enforcement procedures.",
      "Liability is limited to the maximum extent permitted by applicable Indian law.",
    ],
  },
  {
    title: "Governing Law",
    icon: Gavel,
    content: [
      "These Terms are governed by and construed in accordance with the laws of India.",
      "Any disputes arising from these terms shall be subject to the exclusive jurisdiction of courts in New Delhi, India.",
      "The system operates under the authority of the Ministry of Tourism, Government of India.",
      "Users agree to resolve disputes through good-faith negotiation before pursuing legal remedies.",
    ],
  },
];

export default function TermsPage() {
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
              <Scale className="w-8 h-8 text-primary-light" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Terms & Conditions</h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Please read these terms carefully before using the Smart Tourist Safety System.
            </p>
            <p className="text-xs text-white/30 mt-4">Effective date: August 2026</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-bg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-8">
            {sections.map((section, i) => (
              <AnimateOnScroll key={section.title} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center">
                      <section.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-fg">{section.title}</h2>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {section.content.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-muted leading-relaxed">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Shield, Phone, ExternalLink, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const footerLinks = {
  system: [
    { label: "About the System", href: "/about" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Safety Features", href: "/#features" },
    { label: "Supported Languages", href: "/#languages" },
  ],
  services: [
    { label: "Register as Tourist", href: "/register" },
    { label: "Verify Digital ID", href: "/verify" },
    { label: "Authority Login", href: "/login" },
  ],
  support: [
    { label: "Safety Instructions", href: "/safety" },
    { label: "Emergency Contacts", href: "/emergency" },
    { label: "FAQs", href: "/faq" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-surface text-gray-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Smart Tourist</span>
                <span className="text-accent font-bold text-sm"> Safety</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
              {t("foot_desc")}
            </p>
            <div className="space-y-2.5">
              <a href="tel:112" className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                <Phone className="w-4 h-4 text-danger" />
                <span>Emergency: <strong className="text-white">112</strong></span>
              </a>
              <a href="tel:1363" className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                <Phone className="w-4 h-4 text-accent" />
                <span>Tourist Helpline: <strong className="text-white">1363</strong></span>
              </a>
              <a href="tel:1800111363" className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                <Phone className="w-4 h-4 text-primary-light" />
                <span>Toll Free: <strong className="text-white">1800-111-363</strong></span>
              </a>
            </div>
          </div>

          {/* System */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">System</h3>
            <div className="space-y-2.5">
              {footerLinks.system.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Services</h3>
            <div className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
            <div className="space-y-2.5 mb-6">
              {footerLinks.support.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
            <div className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm hover:text-accent transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {t("foot_title")}. {t("foot_copy")}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-danger" /> for tourist safety
            </span>
            <span className="flex items-center gap-1">
              Powered by <span className="text-accent font-medium">Blockchain</span> & <span className="text-primary-light font-medium">AI</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

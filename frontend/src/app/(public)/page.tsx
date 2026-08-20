"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Smart Tourist Safety System
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Ensuring tourist safety through blockchain-secured digital IDs,
            real-time monitoring, and instant emergency response.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors text-lg"
          >
            Register for Digital ID
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Register", desc: "Fill in your details and travel itinerary" },
              { step: "2", title: "Get Digital ID", desc: "Receive a blockchain-secured digital identity" },
              { step: "3", title: "Travel Safely", desc: "Authorities monitor your safety in real-time" },
              { step: "4", title: "Emergency Support", desc: "Instant alerts and response when needed" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Safety Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚨",
                title: "Panic Button",
                desc: "One-tap emergency alert sent directly to nearest authorities with your location.",
              },
              {
                icon: "⬡",
                title: "Geofencing",
                desc: "Automatic alerts when tourists enter restricted or high-risk zones.",
              },
              {
                icon: "📍",
                title: "Real-time Tracking",
                desc: "Live location monitoring for active tourists within the jurisdiction.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p className="mb-2">
            Smart Tourist Safety Monitoring & Incident Response System
          </p>
          <p>Emergency Helpline: 112 | Tourist Helpline: 1363</p>
        </div>
      </footer>
    </div>
  );
}

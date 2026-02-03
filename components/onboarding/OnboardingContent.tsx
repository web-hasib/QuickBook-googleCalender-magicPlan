"use client";

import { Calendar, CheckSquare, DollarSign, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingContent() {
  const router = useRouter();

  const features = [
    {
      id: 1,
      title: "Contract & E-Signature Workflow",
      description: "Create, send, sign, and manage contracts digitally",
      cta: "Start Contract Workflow",
      route: "/contract-setup",
      icon: FileText,
    },
    {
      id: 2,
      title: "Google Calendar Event Automation",
      description: "Auto-create, sync, and manage calendar events",
      cta: "Connect Google Calendar",
      route: "/create-event",
      icon: Calendar,
    },
    {
      id: 3,
      title: "Smart Checklist Management",
      description: "Track tasks, approvals, and step-by-step processes",
      cta: "Create Checklist",
      route: "/checklist-setup",
      icon: CheckSquare,
    },
    {
      id: 4,
      title: "QuickBooks Integration",
      description: "Sync invoices, payments, and financial data",
      cta: "Connect QuickBooks",
      route: "/accounting-integration",
      icon: DollarSign,
    },
  ];

  const handleFeatureClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 md:p-6 overflow-hidden h-screen">
      <div
        className="rounded-lg sm:rounded-xl md:rounded-2xl relative overflow-hidden h-full"
        style={{
          background: "url('/page-background.jpg') no-repeat center/cover",
        }}>
        {/* Glassmorphism blur overlay */}
        <div className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl bg-black/30 backdrop-blur-md overflow-hidden">
          <div className="h-full flex flex-col justify-center items-center text-center px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
            {/* Header Section */}
            <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg">
                Welcome to Our App!
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-md max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4">
                Let&apos;s get you started on an amazing journey.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-7xl">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-white/20 shadow-xl hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                    onClick={() => handleFeatureClick(feature.route)}>
                    {/* Content Section - grows to push button down */}
                    <div className="flex-1 flex flex-col">
                      {/* Icon */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 group-hover:bg-white/30 transition-colors">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-1 sm:mb-2">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3 md:mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* CTA Button - Fixed at bottom */}
                    <Link
                      href={feature.route}
                      className="w-full bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-medium py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 border border-white/30 group-hover:border-white/50 mt-auto">
                      {feature.cta}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Skip Option */}
            <div className="mt-4 sm:mt-6 md:mt-8">
              <Link
                href={"/login"}
                className="text-sm sm:text-base text-white/80 hover:text-white underline underline-offset-4 transition-colors">
                Skip for now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

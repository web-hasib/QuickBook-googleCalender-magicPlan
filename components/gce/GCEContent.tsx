"use client";

import { useState } from "react";

export default function GCEContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    interests: [] as string[],
  });

  const steps = [
    {
      id: "welcome",
      title: "Welcome to GCE",
      subtitle: "Let's personalize your experience",
    },
    {
      id: "profile",
      title: "Tell us about yourself",
      subtitle: "We'll customize your journey",
    },
    {
      id: "preferences",
      title: "What interests you?",
      subtitle: "Pick what matters to you",
    },
    {
      id: "complete",
      title: "You're all set!",
      subtitle: "Let's begin your journey",
    },
  ];

  const roles = [
    "Developer",
    "Designer",
    "Product Manager",
    "Marketer",
    "Other",
  ];
  const interestOptions = [
    "Technology",
    "Design",
    "Business",
    "Marketing",
    "Analytics",
    "Collaboration",
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}></div>
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main container */}
      <div className="w-full max-w-2xl relative">
        {/* Progress indicator */}
        <div className="mb-12 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500
                  ${
                    index <= currentStep
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }
                `}>
                  {index < currentStep ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                    flex-1 h-0.5 mx-2 transition-all duration-500
                    ${index < currentStep ? "bg-emerald-500" : "bg-slate-800"}
                  `}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800/50 shadow-2xl p-8 md:p-12 animate-slideUp">
          {/* Step content */}
          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-light text-white mb-3 tracking-tight animate-fadeIn"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                animationDelay: "0.1s",
              }}>
              {steps[currentStep].title}
            </h1>
            <p
              className="text-slate-400 text-lg animate-fadeIn"
              style={{ animationDelay: "0.2s" }}>
              {steps[currentStep].subtitle}
            </p>
          </div>

          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-8 border border-emerald-500/20">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-2">
                      Quick & Easy Setup
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Just a few steps to get you started. We&apos;ll have you
                      up and running in under 2 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <h4 className="text-white text-sm font-medium mb-1">
                    Personalized
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Tailored to your needs
                  </p>
                </div>

                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3">
                    <svg
                      className="w-5 h-5 text-violet-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-white text-sm font-medium mb-1">
                    Secure
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Your data is protected
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Role
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setFormData({ ...formData, role })}
                      className={`
                        px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${
                          formData.role === role
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-slate-600"
                        }
                      `}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <p className="text-slate-400 text-sm">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`
                      px-5 py-4 rounded-xl text-sm font-medium transition-all text-left
                      ${
                        formData.interests.includes(interest)
                          ? "bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/30 border-0"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-slate-600"
                      }
                    `}>
                    <div className="flex items-center justify-between">
                      <span>{interest}</span>
                      {formData.interests.includes(interest) && (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="text-center space-y-6 animate-fadeIn py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/50 animate-bounce">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl text-white font-light mb-2">
                  Welcome aboard, {formData.name || "there"}!
                </h3>
                <p className="text-slate-400">
                  Your personalized experience is ready
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 text-left space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Name</span>
                  <span className="text-white">{formData.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white">{formData.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Role</span>
                  <span className="text-white">{formData.role || "—"}</span>
                </div>
                <div className="flex items-start justify-between text-sm">
                  <span className="text-slate-400">Interests</span>
                  <span className="text-white text-right">
                    {formData.interests.join(", ") || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`
                px-6 py-3 rounded-xl text-sm font-medium transition-all
                ${
                  currentStep === 0
                    ? "opacity-0 pointer-events-none"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }
              `}>
              ← Back
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className={`
                px-8 py-3 rounded-xl text-sm font-medium transition-all shadow-lg
                ${
                  currentStep === steps.length - 1
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105"
                    : "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105"
                }
              `}>
              {currentStep === steps.length - 1 ? "Get Started" : "Continue →"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

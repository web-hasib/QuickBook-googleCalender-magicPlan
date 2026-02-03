"use client";

export default function OnboardingContent() {
  return (
    <div className="bg-white p-4 overflow-hidden h-screen">
      <div
        className="rounded-xl relative"
        style={{
          background: "url('/page-background.jpg') no-repeat center/cover",
          height: "100%",
        }}>
        {/* Glassmorphism blur overlay */}
        <div className="absolute inset-0 rounded-xl backdrop-blur-sm">
          <div className="h-full flex flex-col justify-center items-center text-center px-6">
            <div className="glass-effect p-4">
              <h1 className="text-4xl font-bold mb-4 text-gray-100">
                Welcome to Our App!
              </h1>
              <p className="text-lg text-gray-200">
                Let&apos;s get you started on an amazing journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

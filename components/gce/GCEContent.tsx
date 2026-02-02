import CreateEventForm from "@/components/gce/CreateEvent";
import Login from "@/components/gce/Login";

export default function GCEContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            Calendar Connect
          </h1>
          <p className="text-slate-600 text-sm">
            Seamlessly manage your Google Calendar events
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 p-8 border border-white/20 animate-slideUp">
          <div className="space-y-4">
            <Login />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 py-1 text-slate-500 rounded-full">
                  or
                </span>
              </div>
            </div>
            <CreateEventForm />
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="group cursor-default">
                <div className="w-10 h-10 mx-auto mb-2 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-slate-600">Fast</p>
              </div>
              <div className="group cursor-default">
                <div className="w-10 h-10 mx-auto mb-2 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-slate-600">Secure</p>
              </div>
              <div className="group cursor-default">
                <div className="w-10 h-10 mx-auto mb-2 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-slate-600">Simple</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center mt-6 animate-fadeIn"
          style={{ animationDelay: "0.2s" }}>
          <p className="text-xs text-slate-500">
            Powered by Google Calendar API
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";

interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  attendees: string;
  reminders: number;
  colorId: string;
}

export default function CreateEventForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    attendees: "",
    reminders: 30,
    colorId: "1",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Event title is required");
      return false;
    }
    if (!formData.startDate || !formData.startTime) {
      setError("Start date and time are required");
      return false;
    }
    if (!formData.endDate || !formData.endTime) {
      setError("End date and time are required");
      return false;
    }

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      setError("End time must be after start time");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      const response = await fetch("/api/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setShowSuccess(true);
      // Reset form after successful creation
      setFormData({
        title: "",
        description: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        attendees: "",
        reminders: 30,
        colorId: "1",
      });

      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-slideDown">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-900">
                Event Created Successfully!
              </h3>
              <p className="text-sm text-green-700">
                Your event has been added to Google Calendar.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-slideDown">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Event Title */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-slate-700">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Team Meeting"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Add event details..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label
            htmlFor="location"
            className="block text-sm font-semibold text-slate-700">
            Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Conference Room A or Zoom Link"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Date and Time Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Start <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-3">
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all duration-200 text-slate-900"
                required
              />
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all duration-200 text-slate-900"
                required
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              End <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-3">
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all duration-200 text-slate-900"
                required
              />
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all duration-200 text-slate-900"
                required
              />
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div className="space-y-2">
          <label
            htmlFor="attendees"
            className="block text-sm font-semibold text-slate-700">
            Attendees (Email addresses)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="attendees"
              name="attendees"
              value={formData.attendees}
              onChange={handleInputChange}
              placeholder="e.g., john@example.com, jane@example.com"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-500 pl-1">
            Separate multiple emails with commas
          </p>
        </div>

        {/* Reminders and Color Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reminder */}
          <div className="space-y-2">
            <label
              htmlFor="reminders"
              className="block text-sm font-semibold text-slate-700">
              Reminder (minutes before)
            </label>
            <select
              id="reminders"
              name="reminders"
              value={formData.reminders}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 bg-white">
              <option value="0">No reminder</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="1440">1 day</option>
            </select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label
              htmlFor="colorId"
              className="block text-sm font-semibold text-slate-700">
              Event Color
            </label>
            <select
              id="colorId"
              name="colorId"
              value={formData.colorId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-slate-900 bg-white">
              <option value="1">Lavender</option>
              <option value="2">Sage</option>
              <option value="3">Grape</option>
              <option value="4">Flamingo</option>
              <option value="5">Banana</option>
              <option value="6">Tangerine</option>
              <option value="7">Peacock</option>
              <option value="8">Graphite</option>
              <option value="9">Blueberry</option>
              <option value="10">Basil</option>
              <option value="11">Tomato</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

          <div className="relative flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Event...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Create Event</span>
              </>
            )}
          </div>
        </button>
      </form>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

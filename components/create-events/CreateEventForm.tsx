"use client";
import { useState, ChangeEvent } from "react";

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
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/page-background.jpg')",
        }}
        aria-hidden="true"
      />

      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10 text-center max-w-4xl w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg">
            Create Calendar Event
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-md px-4">
            Schedule a new event on your Google Calendar
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-4xl">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border border-white/20 shadow-2xl">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Success Message */}
              {showSuccess && (
                <div
                  className="bg-green-500/20 backdrop-blur-sm border-2 border-green-400/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-3 animate-slideDown"
                  role="alert"
                  aria-live="polite">
                  <div className="shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Event Created Successfully!
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 mt-1">
                      Your event has been added to Google Calendar.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  className="bg-red-500/20 backdrop-blur-sm border-2 border-red-400/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-3 animate-slideDown"
                  role="alert"
                  aria-live="assertive">
                  <div className="shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-red-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Error
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 mt-1 break-words">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Event Title */}
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="block text-xs sm:text-sm font-semibold text-white">
                  Event Title <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Team Meeting"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-white/50 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-200 text-white placeholder:text-white/50 backdrop-blur-sm"
                  required
                  aria-required="true"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-xs sm:text-sm font-semibold text-white">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add event details..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-white/50 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-200 text-white placeholder:text-white/50 resize-none backdrop-blur-sm"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="block text-xs sm:text-sm font-semibold text-white">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
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
                    placeholder="e.g., Conference Room A"
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-white/50 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-200 text-white placeholder:text-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Date and Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Start Date & Time */}
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Start <span className="text-red-300">*</span>
                  </h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-green-300/50 focus:ring-4 focus:ring-green-300/10 outline-none transition-all duration-200 text-white backdrop-blur-sm"
                      required
                      aria-required="true"
                    />
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-green-300/50 focus:ring-4 focus:ring-green-300/10 outline-none transition-all duration-200 text-white backdrop-blur-sm"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-red-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    End <span className="text-red-300">*</span>
                  </h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-red-300/50 focus:ring-4 focus:ring-red-300/10 outline-none transition-all duration-200 text-white backdrop-blur-sm"
                      required
                      aria-required="true"
                    />
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-red-300/50 focus:ring-4 focus:ring-red-300/10 outline-none transition-all duration-200 text-white backdrop-blur-sm"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div className="space-y-2">
                <label
                  htmlFor="attendees"
                  className="block text-xs sm:text-sm font-semibold text-white">
                  Attendees (Email addresses)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
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
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-white/50 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-200 text-white placeholder:text-white/50 backdrop-blur-sm"
                  />
                </div>
                <p className="text-xs text-white/70 pl-1">
                  Separate multiple emails with commas
                </p>
              </div>

              {/* Reminders and Color Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Reminder */}
                <div className="space-y-2">
                  <label
                    htmlFor="reminders"
                    className="block text-xs sm:text-sm font-semibold text-white">
                    Reminder (minutes before)
                  </label>
                  <select
                    id="reminders"
                    name="reminders"
                    value={formData.reminders}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-white/50 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-200 text-white backdrop-blur-sm cursor-pointer">
                    <option value="0" className="bg-slate-800 text-white">
                      No reminder
                    </option>
                    <option value="5" className="bg-slate-800 text-white">
                      5 minutes
                    </option>
                    <option value="10" className="bg-slate-800 text-white">
                      10 minutes
                    </option>
                    <option value="15" className="bg-slate-800 text-white">
                      15 minutes
                    </option>
                    <option value="30" className="bg-slate-800 text-white">
                      30 minutes
                    </option>
                    <option value="60" className="bg-slate-800 text-white">
                      1 hour
                    </option>
                    <option value="120" className="bg-slate-800 text-white">
                      2 hours
                    </option>
                    <option value="1440" className="bg-slate-800 text-white">
                      1 day
                    </option>
                  </select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label
                    htmlFor="colorId"
                    className="block text-xs sm:text-sm font-semibold text-white">
                    Event Color
                  </label>
                  <select
                    id="colorId"
                    name="colorId"
                    value={formData.colorId}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-white/10 border-2 border-white/20 focus:border-white/50 focus:ring-4 focus:ring-white/10 outline-none transition-all duration-200 text-white backdrop-blur-sm cursor-pointer">
                    <option value="1" className="bg-slate-800 text-white">
                      Lavender
                    </option>
                    <option value="2" className="bg-slate-800 text-white">
                      Sage
                    </option>
                    <option value="3" className="bg-slate-800 text-white">
                      Grape
                    </option>
                    <option value="4" className="bg-slate-800 text-white">
                      Flamingo
                    </option>
                    <option value="5" className="bg-slate-800 text-white">
                      Banana
                    </option>
                    <option value="6" className="bg-slate-800 text-white">
                      Tangerine
                    </option>
                    <option value="7" className="bg-slate-800 text-white">
                      Peacock
                    </option>
                    <option value="8" className="bg-slate-800 text-white">
                      Graphite
                    </option>
                    <option value="9" className="bg-slate-800 text-white">
                      Blueberry
                    </option>
                    <option value="10" className="bg-slate-800 text-white">
                      Basil
                    </option>
                    <option value="11" className="bg-slate-800 text-white">
                      Tomato
                    </option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 group mt-6 text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30"
                aria-label={
                  isLoading ? "Creating event..." : "Create calendar event"
                }>
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true">
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
              </button>
            </form>
          </div>
        </div>

        {/* Footer note - optional */}
        <p className="mt-6 text-xs sm:text-sm text-white/60 text-center px-4">
          All times are in your local timezone
        </p>
      </div>
    </div>
  );
}

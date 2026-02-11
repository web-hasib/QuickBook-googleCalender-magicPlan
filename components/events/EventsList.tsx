"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

type EventItem = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
  colorId?: string;
};

export default function EventsList() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        if (mounted) setEvents(data.items ?? []);
      } catch (err: unknown) {
        if (mounted)
          setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="w-full max-w-7xl mx-auto mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Text Section */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
                Your Events
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-md">
                View and manage your Google Calendar events
              </p>
            </div>

            {/* Create Event Button */}
            <Link
              href="/create-event"
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-white/30 hover:border-white/50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl backdrop-blur-sm">
              <Calendar className="w-5 h-5" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>

        {/* Content Container */}
        <div className="w-full max-w-7xl mx-auto flex-1">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
                <Loader2 className="w-16 h-16 text-white animate-spin mb-4 mx-auto" />
                <p className="text-white text-xl font-semibold text-center">
                  Loading events...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-20">
              <div className="bg-red-500/20 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-red-400/50 shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-300" />
                  <h3 className="text-xl font-semibold text-white">Error</h3>
                </div>
                <p className="text-white/90 text-center mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (!events || events.length === 0) && (
            <div className="flex items-center justify-center py-20">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl max-w-md w-full text-center">
                <Calendar className="w-20 h-20 text-white/80 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-3">
                  No Events Found
                </h3>
                <p className="text-white/80 mb-8 text-lg">
                  You don&apos;t have any upcoming events in your calendar.
                </p>
                <Link
                  href="/create-event"
                  className="inline-block w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                  Create Your First Event
                </Link>
              </div>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && events && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {events.map((event) => {
                const start = event.start?.dateTime ?? event.start?.date ?? "";
                const end = event.end?.dateTime ?? event.end?.date ?? "";
                const startFormatted = start ? formatDateTime(start) : null;
                const endFormatted = end ? formatDateTime(end) : null;

                return (
                  <article
                    key={event.id ?? `${start}-${event.summary}`}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    {/* Event Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 leading-tight">
                          {event.summary || "Untitled Event"}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-white/80 mb-4 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Date & Time Info */}
                    <div className="space-y-2.5 mb-6 flex-1">
                      {startFormatted && (
                        <div className="flex items-start gap-2.5 text-sm">
                          <Clock className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
                          <div className="text-white/90 leading-relaxed">
                            <span className="font-semibold">Start: </span>
                            <span>{startFormatted.date}</span>
                            <span className="mx-1.5">•</span>
                            <span>{startFormatted.time}</span>
                          </div>
                        </div>
                      )}
                      {endFormatted && (
                        <div className="flex items-start gap-2.5 text-sm">
                          <Clock className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                          <div className="text-white/90 leading-relaxed">
                            <span className="font-semibold">End: </span>
                            <span>{endFormatted.date}</span>
                            <span className="mx-1.5">•</span>
                            <span>{endFormatted.time}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {event.htmlLink ? (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-white/30 group-hover:border-white/50 hover:shadow-lg flex items-center justify-center gap-2 mt-auto">
                        <span>Open in Calendar</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-white/5 text-white/50 font-medium py-3 px-4 rounded-xl border border-white/10 flex items-center justify-center gap-2 mt-auto cursor-not-allowed">
                        <span>No Link Available</span>
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

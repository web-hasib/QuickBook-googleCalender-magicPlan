import { google } from "googleapis";

export async function createCalendarEvent(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: "Client Meeting",
      description: "Project discussion",
      start: {
        dateTime: "2026-02-10T10:00:00+06:00",
      },
      end: {
        dateTime: "2026-02-10T11:00:00+06:00",
      },
    },
  });

  return event.data;
}

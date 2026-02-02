import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { google } from "googleapis";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.json();

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    // Combine date + time into ISO string
    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    ).toISOString();

    const endDateTime = new Date(
      `${formData.endDate}T${formData.endTime}`,
    ).toISOString();

    // Parse attendees string into array
    const attendees = formData.attendees
      ? formData.attendees.split(",").map((email: string) => ({
          email: email.trim(),
        }))
      : [];

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: formData.title,
        description: formData.description,
        location: formData.location,
        colorId: formData.colorId,
        start: {
          dateTime: startDateTime,
        },
        end: {
          dateTime: endDateTime,
        },
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: "popup",
              minutes: Number(formData.reminders) || 30,
            },
          ],
        },
      },
    });

    return NextResponse.json(event.data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}

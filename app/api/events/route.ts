import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { google } from "googleapis";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const timeMin = url.searchParams.get("timeMin") ?? new Date().toISOString();
    const timeMax = url.searchParams.get("timeMax") ?? undefined;
    const maxResults = Number(url.searchParams.get("maxResults")) || 50;

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json(events.data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

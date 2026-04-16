export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assessment } = req.body;

    const event = {
      summary: `${assessment.title} - ${assessment.courseName}`,
      description: `Type: ${assessment.type}\nEffort Hours: ${assessment.effort_hours}\nWeight: ${assessment.weight}%`,
      start: {
        date: assessment.due_date,
        timeZone: 'UTC'
      },
      end: {
        date: assessment.due_date,
        timeZone: 'UTC'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    };

    // For now, just return success
    res.status(200).json({
      message: 'Event would be created in Google Calendar',
      event: event
    });

  } catch (error) {
    console.error('Google Calendar API Error:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
}

import systemContext from "../data.json";

export async function onRequest(context) {
  // Handle OPTIONS request for CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Handle POST request
  if (context.request.method === "POST") {
    try {
      const { env } = context;

      // Verify AI binding
      if (!env.AI) {
        throw new Error("AI binding not configured");
      }

      // Parse request body
      const { messages } = await context.request.json();
      if (!messages || !Array.isArray(messages)) {
        throw new Error("Invalid request format");
      }

      const userPrompt = messages[messages.length - 1].content;

      // Calculate dates for the next 1.5 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 45);

      const chatConfig = {
        messages: [
          {
            role: "system",
            content: `You are a planning assistant that creates detailed schedules. Generate a 1.5-month plan from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]} based on the user's goal.

Format the response as a JSON array of objects with this structure:
[
  {
    "day": "Day of the week",
    "date": "YYYY-MM-DD",
    "task": "Specific task description"
  }
]

Each task should be specific, actionable, and related to the user's goal: ${userPrompt}

Important guidelines:
1. Only include weekdays (Monday to Friday)
2. Make tasks progressive and building upon each other
3. Include regular milestones and review points
4. Keep task descriptions clear and concise
5. Return ONLY the JSON array, no additional text`,
          },
          ...messages,
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0.5,
      };

      try {
        const aiResponse = await env.AI.run(
          "@cf/meta/llama-2-7b-chat-int8",
          chatConfig,
        );

        if (!aiResponse || !aiResponse.response) {
          throw new Error("Empty AI response");
        }

        const parsedResponse = JSON.parse(aiResponse.response);

        if (!Array.isArray(parsedResponse) || !parsedResponse.length) {
          throw new Error("Invalid response format");
        }

        return new Response(JSON.stringify({ response: parsedResponse }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("AI or parsing error:", error);
        return new Response(
          JSON.stringify({
            error: error.message,
            fallback: systemContext,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    } catch (error) {
      console.error("Server error:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
          fallback: systemContext,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }

  // Handle other HTTP methods
  return new Response("Method not allowed", { status: 405 });
}

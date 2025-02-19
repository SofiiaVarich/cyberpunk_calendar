import systemContext from "./data.json";

export const onRequestPost = async (context) => {
  try {
    const { request, env } = context;

    // Verify AI binding
    if (!env.AI) {
      throw new Error("AI binding not configured");
    }

    // Parse request body
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request format");
    }

    const userPrompt = messages[messages.length - 1].content;

    // Calculate dates for the next 1.5 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 45); // 1.5 months approximately

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

    // Call AI model
    const aiResponse = await env.AI.run(
      "@cf/meta/llama-2-7b-chat-int8",
      chatConfig,
    );

    if (!aiResponse || !aiResponse.response) {
      throw new Error("Empty AI response");
    }

    try {
      // Attempt to parse AI response as JSON
      const parsedResponse = JSON.parse(aiResponse.response);

      // Validate response format
      if (!Array.isArray(parsedResponse) || !parsedResponse.length) {
        throw new Error("Invalid response format");
      }

      // Validate each entry
      parsedResponse.forEach((entry) => {
        if (!entry.day || !entry.date || !entry.task) {
          throw new Error("Missing required fields in response");
        }
      });

      return new Response(
        JSON.stringify({
          response: parsedResponse,
          messages: messages,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        },
      );
    } catch (parseError) {
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        fallback: systemContext,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      },
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
};

export const onRequest = async (context) => {
  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};

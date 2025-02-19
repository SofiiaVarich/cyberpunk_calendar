export async function onRequest(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { request, env } = context;

    if (!env.AI) {
      throw new Error("AI binding not configured");
    }

    // Parse request body
    const data = await request.json();
    const messages = data.messages || [];

    if (!messages.length) {
      throw new Error("No message provided");
    }

    const userPrompt = messages[messages.length - 1].content;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 45);

    const chatConfig = {
      messages: [
        {
          role: "system",
          content: `Create a 1.5-month plan from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]} for: ${userPrompt}

Return ONLY a JSON array with this structure:
[
  {
    "day": "Day of the week",
    "date": "YYYY-MM-DD",
    "task": "Task description"
  }
]`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };

    const aiResponse = await env.AI.run(
      "@cf/meta/llama-2-7b-chat-int8",
      chatConfig,
    );

    if (!aiResponse?.response) {
      throw new Error("Empty AI response");
    }

    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      return new Response(JSON.stringify({ response: parsedResponse }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (parseError) {
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        fallback: await import("../data.json"),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
}

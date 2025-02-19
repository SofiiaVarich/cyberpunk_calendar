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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { request, env } = context;

    if (!env.AI) {
      throw new Error("AI binding not configured");
    }

    const data = await request.json();
    const userPrompt = data.messages?.[0]?.content;

    if (!userPrompt) {
      throw new Error("No prompt provided");
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 45);

    const systemPrompt = `Create a 1.5-month plan from ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]} for: ${userPrompt}
        Return ONLY a JSON array with this structure:
        [{"day": "Day of week", "date": "YYYY-MM-DD", "task": "Task description"}]`;

    const aiResponse = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    if (!aiResponse?.response) {
      throw new Error("Empty AI response");
    }

    const parsedResponse = JSON.parse(aiResponse.response);

    return new Response(JSON.stringify({ response: parsedResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);

    const fallbackData = await import("../data.json");

    return new Response(
      JSON.stringify({
        error: error.message,
        fallback: fallbackData.default,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

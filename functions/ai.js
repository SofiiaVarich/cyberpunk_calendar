import systemContext from "./data.json";

export const onRequestPost = async (context) => {
  try {
    const { request, env } = context;
    const { messages } = await request.json();

    console.log("Received messages:", messages);

    const userPrompt = messages[messages.length - 1].content;

    const chatConfig = {
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant that helps users create detailed plans based on their goals. The user will provide a goal, and you will generate a plan for the next 1.5 months (approximately 45 days) with specific tasks and dates. The plan should be realistic, actionable, and broken down into manageable steps.

Context (Follow this exact structure):
${JSON.stringify(systemContext, null, 2)}

IMPORTANT: Return ONLY the JSON content with the following structure:
[
  {
    "day": "Day of the week",
    "date": "YYYY-MM-DD",
    "task": "Task description"
  },
  ...
]

User's goal: ${userPrompt}
`,
        },
        ...messages,
      ],
      max_tokens: 4000,
      temperature: 0.5,
      top_p: 0.9,
      top_k: 50,
      repetition_penalty: 1.1,
    };

    console.log("Chat config:", chatConfig);

    const response = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct-fast",
      chatConfig,
    );

    console.log("AI response:", response);

    if (response.response) {
      const jsonResponse = response.response;

      try {
        const parsedResponse = JSON.parse(jsonResponse);
        console.log("Parsed response:", parsedResponse);
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          return new Response(
            JSON.stringify({
              response: parsedResponse,
              messages: messages,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        } else {
          throw new Error("Invalid JSON response");
        }
      } catch (error) {
        console.warn("Invalid JSON response detected, using fallback");
        return new Response(
          JSON.stringify({
            error: "Invalid JSON response",
            fallback: systemContext,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "No response from AI",
        fallback: systemContext,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
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

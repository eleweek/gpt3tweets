const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default async function handler(req, res) {
  const { model } = req.query;

  const { data, error } = await supabase
    .from("models")
    .select("openai_model_name, tweet_prompt")
    .eq("display_model_name", model);

  console.log("generate_tweet handler", model);

  if (data) {
    if (data.length === 0) {
      res.end(
        JSON.stringify({
          error: "No model found",
          text: null,
        })
      );
    }

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
      model: data[0].openai_model_name,
      prompt: data[0].tweet_prompt.endsWith("\n")
        ? data[0].tweet_prompt
        : data[0].tweet_prompt + "\n",
      max_tokens: 64,
      temperature: 0.9,
      stop: ["###", "######"],
    });

    res.end(
      JSON.stringify({
        error: null,
        text: response.data.choices[0].text,
      })
    );
  } else {
    res.end(
      JSON.stringify({
        error: error,
        text: null,
      })
    );
  }
}

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

import { supabase } from "../../../../utils/supabase";

export default async function handler(req, res) {
  const { model } = req.query;

  const { data, error } = await supabase
    .from("models")
    .select("id, openai_model_name, tweet_prompt")
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

    const responseText = response.data.choices[0].text;

    const { data: dataInserted, error: errorInserted } = await supabase
      .from("generated_tweets")
      .insert({
        model_id: data[0].id,
        text: responseText,
      })
      .select();

    if (errorInserted) {
      res.end(
        JSON.stringify({
          error: errorInserted,
          text: responseText,
        })
      );
    } else {
      res.end(
        JSON.stringify({
          error: null,
          text: responseText,
          id: dataInserted[0].id,
          votes: 0,
        })
      );
    }
  } else {
    res.end(
      JSON.stringify({
        error: error,
        text: null,
      })
    );
  }
}

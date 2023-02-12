import { supabase } from "../../../../utils/supabase";

export default async function handler(req, res) {
  const MAX_TWEETS = 40;

  const { model } = req.query;

  const { data, error } = await supabase
    .from("models")
    .select("id")
    .eq("display_model_name", model);

  if (data) {
    if (data.length === 0) {
      res.end(
        JSON.stringify({
          error: "No model found",
          text: null,
        })
      );
    } else {
      const id = data[0].id;

      const { data: dataTweets, error: errorTweets } = await supabase
        .from("generated_tweets")
        .select("id, text, votes")
        .eq("model_id", id)
        .order("created_at", { ascending: false })
        .limit(MAX_TWEETS);

      if (data) {
        res.end(
          JSON.stringify({
            error: null,
            tweets: dataTweets,
          })
        );
      } else {
        res.end(
          JSON.stringify({
            error: errorTweets,
            tweets: null,
          })
        );
      }
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

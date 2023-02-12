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
      res.json({
        error: "No model found",
        text: null,
      });
    } else {
      const id = data[0].id;

      const { data: dataTweets, error: errorTweets } = await supabase
        .from("generated_tweets")
        .select("id, text, votes")
        .eq("model_id", id)
        .order("votes", { ascending: false })
        .order("id", { ascending: false })
        .limit(MAX_TWEETS);

      if (data) {
        res.json({
          error: null,
          tweets: dataTweets,
        });
      } else {
        res.json({
          error: errorTweets,
          tweets: null,
        });
      }
    }
  } else {
    res.json({
      error: error,
      text: null,
    });
  }
}

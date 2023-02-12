import { supabase } from "../../../../utils/supabase";

export default async function handler(req, res) {
  let { id, deltaVotes } = req.query;
  deltaVotes = parseInt(deltaVotes, 10);
  console.log("Server side vote", id, deltaVotes);

  const { data, error } = await supabase
    .from("generated_tweets")
    .select("id, votes")
    .eq("id", id);

  if (data) {
    if (data.length === 0) {
      res.json({
        error: "No tweet found",
        votes: null,
      });
    } else {
      const { data: dataUpdate, error: errorUpdate } = await supabase
        .from("generated_tweets")
        .update({ votes: data[0].votes + deltaVotes })
        .eq("id", id)
        .select("id, votes");

      if (dataUpdate) {
        res.json({
          error: null,
          id: dataUpdate[0].id,
          votes: dataUpdate[0].votes,
        });
      } else {
        res.json({
          error: errorUpdate,
          votes: null,
        });
      }
    }
  } else {
    res.json({
      error: error,
      votes: null,
    });
  }
}

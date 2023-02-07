export default function handler(req, res) {
  const { model } = req.query;
  res.end(`Model: ${model}`);
}

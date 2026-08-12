import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Academic Engagement Portal Backend running on port ${PORT}`);
});

import app from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Academic Engagement Portal Backend running on port ${PORT}`);
});

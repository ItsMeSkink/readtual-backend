import express from "express";
const app = express();
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(cors());

app.listen(80, () => {
  console.log("THE PORT IS UP AND RUNNING");
});

app.get("/test", (req, res) => {
  res.send(true);
});

export default app;



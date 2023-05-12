import { user } from "./mongoSetup.js";
import app from "./appSetup.js";

app.get("/emailLoginCheck", (req, res) => {
  let data = req.query;

  user.findOne({ email: data.email }).then((res1) => {
    if (res1 !== undefined) {
      res.send(true); // already exists
    } else {
      res.send(false); // doesn't exist
    }
  });
});

app.get("/retrieveFullUserData", (req, res) => {
  let data = req.query; // only id needed

  user.findById(data.id).then((res1) => {
    res.send(res1);
  });
});

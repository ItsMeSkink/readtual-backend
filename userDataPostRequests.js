import app from "./appSetup.js";
import { user } from "./mongoSetup.js";

app.post("/newFreshUser", (req, res) => {
  let data = req.query;
  console.log(data);
  let newUserObject = {
    fullname: data.fullname,
    email: data.email,
    password: data.password,
    age: Number(data.age),
  };
  //   res.send(data);

  new user(newUserObject).save().then((res1) => {
    res.send(res1);
  });
});

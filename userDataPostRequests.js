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

//___________________________________________________________________________________________

app.post("/selectOrChangeUsername", (req, res) => {
  let data = req.query; // id, email and selected username needed

  user
    .findOne({ username: data.username })
    .then((res1) => {
      if (res1 !== undefined) {
        // if the system finds an already existing user with the same username, it rejects it otherwise accepts it
        user
          .findOneAndUpdate(
            {
              _id: data.id,
              email: data.email, // email for doube verification
            },
            {
              $set: {
                username: data.username,
              },
            }
          )
          .then((res2) => {
            res.send(res2); // just confirms the change/selection
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.send(false);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});


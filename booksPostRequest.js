import mongoose from "mongoose";
import app from "./appSetup.js";
import { readlist, user } from "./mongoSetup.js";
import { BSON } from "bson";
import { getRawBookData } from "./booksGetRequest.js";

app.post("/addNewUnreadBook", (req, res) => {
  let data = req.query; // id, isbn, pagesToReadEverday required

  let currentDate = new Date().toLocaleDateString();

  let newBookAdditionObject = {
    isbn: data.isbn, // only isbn would be stored for a particaular book. to display on frontend, the isbn would be processed in the last function.
    isSaved: false,
    isLiked: false,
    status: {
      isCurrentlyReading: true,
      pagesRead: 0,
      startDate: currentDate,
      endDate: null,
    },
    pagesToReadEveryday: Number(data.pagesToReadEveryday) || 15, // if the person choses the number, it would be set. If no specific number has been set, 15 would be automatically set,
    comprehensionLevel: 0, // this would be set based on the brief quizes
    speedReadingTime: 0, // this would be set if the person opts for it. further it works on the basis of timer or prompt
  };

  user.findById(data.id).then((res1) => {
    let booksRead = res1.booksRead;

    let sameISBNFilter = booksRead.find((item) => {
      return item.isbn == data.isbn;
    });

    if (sameISBNFilter === undefined) {
      console.log(true); // new book addable
      user
        .findByIdAndUpdate(data.id, {
          $push: {
            booksRead: newBookAdditionObject,
          },
        })
        .then((res2) => {
          res.send(res2); // here it sends the confirmation that book is addaed. it is directly added to currently reading
        });
    } else {
      console.log(false); // no book addable
      res.send(false); // returns the book is already added, tells to click on re-read if they want to re-read
    }
  });
});
//___________________________________________________________________________________________

app.post("/addReadBook", (req, res) => {
  let data = req.query; // id, isbn, pagesToReadEverday required

  let currentDate = new Date().toLocaleDateString();

  let newBookAdditionObject = {
    isbn: data.isbn,
    isSaved: false,
    isLiked: false,
    status: {
      isCurrentlyReading: false,
      pagesRead: 0, // number of pages in a book
      startDate: currentDate,
      endDate: currentDate,
    },
    // no comprehesion or speed reading data
  };

  user.findById(data.id).then((res1) => {
    let booksRead = res1.booksRead;

    let sameISBNFilter = booksRead.find((item) => {
      return item.isbn == data.isbn;
    });

    if (sameISBNFilter === undefined) {
      console.log(true); // new book addable
      user
        .findByIdAndUpdate(data.id, {
          $push: {
            booksRead: newBookAdditionObject,
          },
        })
        .then((res2) => {
          res.send(res2.booksRead); // here it sends the confirmation that book is added. it is directly added to currently reading
        });
    } else {
      console.log(false); // no book addable
      res.send(false); // returns the book is already added, tells to click on re-read if they want to re-read
    }
  });
});

//___________________________________________________________________________________________

app.post("/toggleLikeBook", (req, res) => {
  let data = req.query; // id and isbn required

  user.findById(data.id).then((res1) => {
    let booksRead = res1.booksRead;
    let toLikeBook = booksRead.filter((item) => {
      return item.isbn === data.isbn;
    })[0];

    if (toLikeBook) {
      if (toLikeBook.isLiked === false) {
        user
          .updateOne(
            { _id: data.id },
            {
              $push: {
                likedBooks: data.isbn,
              },
            }
          )
          .then((res2) => {
            console.log(res2);
          });
      } else {
        user
          .updateOne(
            { _id: data.id },
            {
              $pull: {
                likedBooks: data.isbn,
              },
            }
          )
          .then((res2) => {
            console.log(res2);
          });
      }
      user
        .updateOne(
          { _id: data.id, "booksRead.isbn": data.isbn },
          {
            $set: {
              "booksRead.$.isLiked": !toLikeBook.isLiked,
            },
          }
        )
        .then((res1) => {
          res.send(res1);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      res.send(false); // would return false if the book hasn't been read. although the UI wouldn't enable the books unread to be swipeable.
    }
  });
});

//___________________________________________________________________________________________

app.post("/toggleSaveBook", (req, res) => {
  let data = req.query; // id and isbn required

  user.findById(data.id).then((res1) => {
    let booksRead = res1.booksRead;
    let toSaveBook = booksRead.filter((item) => {
      return item.isbn === data.isbn;
    })[0];
    let savedBookCheck = res1.savedBooks.filter((item) => {
      return item === data.isbn;
    })[0];

    if (savedBookCheck === undefined) {
      user
        .updateOne(
          { _id: data.id },
          {
            $push: {
              savedBooks: data.isbn,
            },
          }
        )
        .then((res2) => {
          res.send(res2);
        }); // adds to the savedBooks Array
    } else {
      user
        .updateOne(
          { _id: data.id },
          {
            $pull: {
              savedBooks: data.isbn,
            },
          }
        )
        .then((res2) => {
          res.send(res2);
        }); // removes from the savedBooks array
    }

    if (toSaveBook !== undefined) {
      user
        .updateOne(
          { _id: data.id, "booksRead.isbn": data.isbn },
          {
            $set: {
              "booksRead.$.isSaved": !toSaveBook.isSaved,
            },
          }
        )
        .then((res1) => res1)
        .catch((err) => {
          console.error(err);
        }); // modifies the booksRead Object
    } else {
      console.log("this was not read by user");
    }
  });
});

//___________________________________________________________________________________________

app.post("/createReadlist", (req, res) => {
  let data = req.query; // id, username, readlist title required

  let newReadlistObject = {
    title: data.title,
    books: [],
    creator: {
      id: data.id,
      username: data.username,
    },
    isPublic: Boolean(data.isPublic) || false,
    thumbnail: data.thumbnail || null,
  };

  new readlist(newReadlistObject).save().then((res1) => {
    // this saves the data into the readlist collection of the bookbase database
    res1.id = String(res1._id);

    user
      .findByIdAndUpdate(data.id, {
        $push: {
          readlistsCreated: res1, // this pushes the object into the "readlistsCreated" array of the user
        },
      })
      .then((res2) => {
        res.send(res1);
      })
      .catch((err) => {
        console.error(err);
      });
  });
});

//___________________________________________________________________________________________

app.post("/addBookToReadlist", (req, res) => {
  let data = req.query; // id, isbn, readlist id required

  // thumbnail check and first book's thumbnail add

  // readlist
  //   .findByIdAndUpdate(data.readlistId, {
  //     $push: {
  //       books: data.isbn,
  //     },
  //   })
  //   .then((res1) => res1)
  //   .catch((err) => {
  //     console.error(err);
  //   }); // adds the book to the "books" array in the document in the readlist collection of bookbase database

  user.findById(data.id).then(async (res1) => {
    // add to the user document

    let currentReadlist = res1.readlistsCreated.find((item) => {
      return (item.id = data.readlistId);
    });

    // if (currentReadlist.thumbnail === undefined) {
    //   let bookData = await getRawBookData(data.isbn);
    //   console.log(bookData);
    // }
    // console.log(currentReadlist);
    // res.send(currentReadlist);

    // user
    //   .findOneAndUpdate(
    //     {
    //       _id: data.id,
    //       "readlistsCreated.id": data.readlistId,
    //     },

    //     {
    //       $push: {
    //         "readlistsCreated.$.books": data.isbn,
    //       },
    //     }
    //   )
    //   .then((res2) => {
    //     res.send(res2.readlistsCreated);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
  });
  // two functions, add book to the public readlists database,
});

//___________________________________________________________________________________________

app.post("/removeBookFromReadlist", (req, res) => {
  let data = req.query; // id, isbn, readlist id required

  readlist
    .findByIdAndUpdate(data.readlistId, {
      $pull: {
        books: data.isbn,
      },
    })
    .then((res1) => res1)
    .catch((err) => {
      console.error(err);
    }); // removes the book from the "books" array in the document in the readlist collection of bookbase database

  user.findById(data.id).then((res1) => {
    // removes from the user document

    user
      .findOneAndUpdate(
        {
          _id: data.id,
          "readlistsCreated.id": data.readlistId,
        },

        {
          $pull: {
            "readlistsCreated.$.books": data.isbn,
          },
        }
      )
      .then((res2) => {
        res.send(res2.readlistsCreated);
      })
      .catch((err) => {
        console.error(err);
      });
  });
  // two functions, add book to the public readlists database,
});

//___________________________________________________________________________________________

app.post("/saveReadlist", (req, res) => {
  let data = req.query; // id, readlistId needed
  //  adds book to the readlistsSaved
  user.findByIdAndUpdate(data.id, {
    $push: {
      readlistsSaved: data.readlistId,
    },
  });
});

//___________________________________________________________________________________________

app.post("/unsaveReadlist", (req, res) => {
  let data = req.query; // id, readlistId needed
  //  removes book from the readlistsSaved

  user.findByIdAndUpdate(data.id, {
    $pull: {
      readlistsSaved: data.readlistId,
    },
  });
});

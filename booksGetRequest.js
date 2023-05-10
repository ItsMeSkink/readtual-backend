import axios from "axios";
import app from "./appSetup.js";
import { user } from "./mongoSetup.js";
import { GOOGLE_IMG_SCRAP } from "google-img-scrap";
import { publicBook } from "./mongoSetup.js";
const googleimages = GOOGLE_IMG_SCRAP;

app.get("/retrieveRawBookDataFromWeb", (req, res) => {
  let data = req.query; //isbn required only
  axios
    .get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${data.isbn}`)
    .then(async (res1) => {
      let rawBooksData = res1.data.items[0].volumeInfo;
      async function getThumbnail() {
        return axios
          .get(`https://pictures.abebooks.com/isbn/${data.isbn}-us.jpg`)
          .then(() => `https://pictures.abebooks.com/isbn/${data.isbn}-us.jpg`)
          .catch(() => rawBooksData.imageLinks.thumbnail)
          .catch(() => "");
      } // refers to select a better image from abe books instead of available in google database. if not available, selects the google one.

      async function getAuthorImage() {
        return await googleimages({
          search: rawBooksData.authors != "" ? rawBooksData.authors[0] : "author",
        });
      } // refers to author i mage link

      if (rawBooksData.authors == undefined) {
        rawBooksData.authors = [""];
      }

      let exportableRawBookObject = {
        title: rawBooksData.title,
        author: rawBooksData.authors[0] || "",
        about: rawBooksData.description,
        isbnImage: `https://barcode.tec-it.com/barcode.ashx?data=${data.isbn}&code=ISBN13`,
        thumbnail: await getThumbnail(),
        pages: rawBooksData.pageCount,
        averageRating: rawBooksData.averageRating,
        isbn: data.isbn,
        authorImage: (await getAuthorImage()).result[0].url,
        categories: rawBooksData.categories || [],
      }; // this is the processed data which is actually exported for utilisation

      res.send(exportableRawBookObject);
    })
    .catch((err) => {
      console.log(err);
    });
});

async function getRawBookData(isbn) {
  return axios
    .get("/retrieveRawBookDataFromWeb", {
      params: {
        isbn: isbn,
      },
    })
    .then((rawBookData) => rawBookData.data)
    .catch((err) => {
      console.log(isbn);
      return err;
    });
}

//___________________________________________________________________________________________

app.get("/retrieveBookDataFromReadtualDatabase", (req, res) => {
  // average comprehension level, reveiws
  //   single book
  let data = req.query;

  publicBook.findOne({ isbn: data.isbn });
}); // later development, based on multiple isbns, loaded data. THIS WOULD BECOME AN IDEAL BOOK DATA RECIEVING END FOR ALL BOOKS

//___________________________________________________________________________________________

app.get("/retrieveBookDataFromUserData", (req, res) => {
  // isbn & id required
  // single book retrieval
  let data = req.query;

  user.findById(data.id).then(async (res1) => {
    let booksReadByUser = res1.booksRead;

    let readBook = booksReadByUser.filter((item) => {
      return item.isbn === data.isbn;
    })[0];

    let newBookAdditionObject = {
      isbn: data.isbn,
      isSaved: false,
      isLiked: false,
      status: {
        isCurrentlyReading: false,
      },
    }; // object for book that would be finally displayed on single page book dipslay

    if (readBook !== undefined) {
      let exportableFullBookObject = {
        ...(await getRawBookData(readBook.isbn)),
        ...readBook,
      };
      res.send(exportableFullBookObject);
    } else {
      let exportableFullBookObject = {
        ...(await getRawBookData(data.isbn)),
        ...newBookAdditionObject,
      };
      res.send(exportableFullBookObject); // this object would be exported for ideal display of a single page book
    }
  });
});

async function getProcessedBookData(isbn, id) {
  return await axios
    .get("/retrieveBookDataFromUserData", {
      params: {
        id: id,
        isbn: isbn,
      },
    })
    .then((processedBookData) => processedBookData.data);
}

app.get("/retrieveBookDataArrayFromUserData", (req, res) => {
  let data = req.query; // id needed

  user
    .findById(data.id)
    .then(async (res1) => {
      let booksRead = res1.booksRead;

      let booksReadExpandedArray = await Promise.all(
        booksRead.map((item) => getProcessedBookData(item.isbn, data.id))
      )
        .then((props) => {
          return props;
        })
        .catch((err) => {
          console.error(err);
        });
      res.send(booksReadExpandedArray);
    })
    .catch((err) => {
      console.error(err);
    });
});

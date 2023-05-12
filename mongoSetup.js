import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const userBase = mongoose
  .createConnection(
    "mongodb+srv://lakshyapratapmonga:lN2PpwXNcilzYl8j@readtual.j8lom.mongodb.net/userbase?retryWrites=true&w=majority"
  )
  .once("open", () => {
    console.dir("The -userbase- database is successfully connected");
    console.log("----------------------------------------------------");
  });

const booksBase = mongoose
  .createConnection(
    "mongodb+srv://lakshyapratapmonga:lN2PpwXNcilzYl8j@readtual.j8lom.mongodb.net/booksbase?retryWrites=true&w=majority"
  )
  .once("open", () => {
    console.log("----------------------------------------------------");
    console.dir("The -booksbase- databsae is successfully connected");
  });

const userSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  booksRead: Array,
  age: Number,
  email: String,
  password: String,
  latestBooks: Array,
  interests: Array,
  authorFollowing: Array,
  averageComprehensionLevel: Number,
  averageSpeedReadingTime: Number,
  readlistsCreated: Array,
  readlistsSaved: Array,
  profileImage: String,
  devicesLoggedIn: String,
  savedBooks: Array,
  likedBooks: Array,
});

const publicBookSchema = new mongoose.Schema({
  isbn: Number,
  title: String,
  author: String,
  isbnImage: String,
  description: String,
  thumbnail: String,
  pages: Number,
  averageRating: Number,
  averageCL: Number,
  averageSPR: Number,
});

const readListSchema = new mongoose.Schema({
  title: String,
  id: String,
  books: Array,
  creator: Object, // user-id and username
  isPublic: Boolean,
  categories: Array, // combines the categories of the books it contains
});

export const user = userBase.model("userbases", userSchema);
export const publicBook = booksBase.model("booksbase", publicBookSchema);
export const readlist = booksBase.model("readlistsbase", readListSchema);

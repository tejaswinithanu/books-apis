const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3007, () => {
      console.log("Server Running at http://localhost:3007/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//get all books and filtered books
app.get("/books/", async (request, response) => {
  const { search_q = "" } = request.query;
  const getBooksQuery = `
    SELECT
      *
    FROM
      books WHERE title LIKE '%${search_q}%' OR author LIKE '%${search_q}%';`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//get a single book by id
app.get("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  const getBookQuery = `
        SELECT * FROM books WHERE id=${bookId};
    `;
  const returnedBook = await db.get(getBookQuery);
  response.send(returnedBook);
});

//add a book
app.post("/books/", async (request, response) => {
  const bookDetails = request.body;
  const { id, title, author, genre, rating, imgUrl } = bookDetails;
  const addBookQuery = `
    INSERT INTO
      books 
    VALUES
      (
        ${id},
        '${title}',
        '${author}',
        '${genre}',
        ${rating},
        '${imgUrl}'
      );`;

  const dbResponse = await db.run(addBookQuery);
  const bookId = dbResponse.lastID;
  response.send({ bookId: bookId });
});

//update book based on id
app.put("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  const getBookQuery = `
        SELECT * FROM books WHERE id=${bookId};
    `;
  const requestedBook = await db.get(getBookQuery);
  const {
    title = requestedBook.title,
    author = requestedBook.author,
    genre = requestedBook.genre,
    rating = requestedBook.rating,
    imgUrl = requestedBook.imgUrl,
  } = request.body;
  const updateBookQuery = `
    UPDATE books
    SET 
        title='${title}',
        author='${author}',
        genre='${genre}',
        rating='${rating}',
        imgUrl='${imgUrl}'
    WHERE id=${bookId};
  `;
  await db.run(updateBookQuery);
  const getUpdatedBookQuery = `
    SELECT * FROM books WHERE id=${bookId};
  `;
  const updatedBook = await db.get(getUpdatedBookQuery);
  response.send(updatedBook);
});

//delete a book based on id
app.delete("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  const deleteBookQuery = `
        DELETE FROM books
        WHERE id=${bookId};
    `;
  await db.run(deleteBookQuery);
  const getBooksQuery = `
        SELECT * FROM books;
    `;
  const allBooks = await db.all(getBooksQuery);
  response.send(allBooks);
});

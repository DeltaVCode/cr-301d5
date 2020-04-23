const superagent = require('superagent');

function bookSearch(request, response, next) {
  const { title } = request.query;
  if (!title) {
    response.render('pages/book-search', {
      title: '',
      books: [],
    });
    return;
  }

  let url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({
      q: `+intitle:${title}`,
    })
    .then(result => {
      let books = result.body.items.map(item => new Book(item));
      response.render('pages/book-search', {
        title,
        books,
      });
    })
    .catch(err => next(err));
}

function Book(bookData) {
  this.title = bookData.volumeInfo.title;

  this.image_url = parseBookImage(bookData.volumeInfo.imageLinks).replace('http:', 'https:');
  // this.isbn = parseIsbn(bookData.volumeInfo.industryIdentifiers);
}

const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
function parseBookImage(imageLinks) {
  console.log(imageLinks);
  if (!imageLinks){
    return placeholderImage;
  }

  if (imageLinks.thumbnail) {
    return imageLinks.thumbnail.replace('http:', 'https:');
  }

  return imageLinks.smallThumbnail || placeholderImage;
}

module.exports = bookSearch;

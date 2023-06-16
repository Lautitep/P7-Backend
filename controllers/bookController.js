const fs = require('fs');
const Book = require('../models/book');

exports.getAllBooks = (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    // .then((book) => console.log('book', book))
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.createBook = (req, res) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject.id;
  delete bookObject.userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });

  book.save()
    .then(() => { res.status(201).json({ message: 'Objet enregistré !' }); })
    .catch((error) => { res.status(400).json({ error }); });
};

exports.updateBook = (req, res) => {
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  } : { ...req.body };

  delete bookObject.userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre modifié!' }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => { res.status(200).json({ message: 'Objet supprimé !' }); })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.rateBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      const { rating } = req.body;
      const { userId } = req.body;
      const oldRating = book.ratings.find((r) => r.userId === userId);
      if (oldRating) return;
      book.ratings.push({ userId, grade: rating });
      // eslint-disable-next-line max-len
      const averageRating = book.ratings.reduce((acc, curr) => acc + curr.grade, 0) / book.ratings.length;
      const roundedAverageRating = Math.round(averageRating);
      book.averageRating = roundedAverageRating;
      book.save()
        .then(() => { res.status(201).json(book); })
        .catch((error) => { res.status(400).json({ error }); });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getBestRatedBooks = (req, res) => {
  Book.find()
    .then((books) => {
      const bestRatedBooks = books.sort((a, b) => b.averageRating - a.averageRating).slice(0, 3);
      res.status(200).json(bestRatedBooks);
    })
    .catch((error) => res.status(400).json({ error }));
};

const db = require('../json/bible.json');
const BOOK_NOT_FOUND = 'BookNotFound';
const CHAPTER_NOT_FOUND = 'ChapterNotFound';
function getBook(bookName) {
    const book = db.find(
        element => element.bookName == bookName
    );
    if (!book) return BOOK_NOT_FOUND;
    return book;
}
function getChaptersOfBook(bookName) {
    const bookObject = getBook(bookName);
    if (bookObject === BOOK_NOT_FOUND) return BOOK_NOT_FOUND;
    return bookObject.chapters;
}
function getOneChapter(bookName, chapterNumber) {
    const chapterObjectArray = getChaptersOfBook(bookName);
    for (i in chapterObjectArray) {
        if (chapterObjectArray[ i ].chapterNumber == chapterNumber) return chapterObjectArray[ i ];
    }
    return CHAPTER_NOT_FOUND;
}

module.exports = {
    index(req, res) {
        const bookList = { oldTestament: [], newTestament: [] };
        for (i in db) {
            const { bookName
            } = db[ i ];
            if (i < 39) {
                bookList.oldTestament.push(bookName)
            }
            else { bookList.newTestament.push(bookName); }
        }
        return res.json(bookList);
    },
    showBook(req, res) {
        bookName = req.params.bookName;
        var onlyCountChapters = false;
        if (bookName.startsWith('@')) {
            bookName = bookName.substring(1);
            onlyCountChapters = true;
        }
        const chapters = getChaptersOfBook(bookName);
        if (chapters === BOOK_NOT_FOUND) return res.json({ error: BOOK_NOT_FOUND });
        var chaptersCount = 0;
        for (i in chapters) chaptersCount++;
        if (onlyCountChapters) return res.json({ bookName, chaptersCount });
        return res.json({ bookName, chaptersCount, chapters });
    },
    showChapter(req, res) {
        const bookName = req.params.bookName;
        var chapterNumber = req.params.chapterNumber;
        var onlyCountVerses = false;
        if (chapterNumber.startsWith('@')) {
            chapterNumber = chapterNumber.substring(1);
            onlyCountVerses = true;
        }
        const response = getOneChapter(bookName, chapterNumber);
        if (response === CHAPTER_NOT_FOUND) return res.json({ error: CHAPTER_NOT_FOUND });
        const { paragraphs } = response;
        var versesCount = 0;
        var paragraphCount = 0;
        for (i in paragraphs) {
            paragraphCount++;
            for (j in paragraphs[ i ]) {
                versesCount++;
                if (!isNaN(Number(paragraphs[ i ][ j ].verseNumber))) paragraphs[ i ][ j ].verseNumber = paragraphs[ i ][ j ].verseNumber.toString();
            }
        }
        if (onlyCountVerses) return res.json({ chapterNumber, paragraphCount, versesCount })
        return res.json({ chapterNumber, paragraphCount, versesCount, paragraphs });
    }
}
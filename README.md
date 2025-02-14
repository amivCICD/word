# Spring Boot, TypeScript powered "Chic" style and themed Wordle game that allows replayability after the initial word of the day.
- If you want to customize this app just install the dependencies for npm by running `npm i` in the root folder, followed by `mvn clean install` to install maven dependencies
- **Note:** you must build the SQLite database upon fresh install as the DB is not portable on a fresh build. To do so, uncomment out these lines in ServerApplication.java: // SQLiteCreateTable.createWordTable("words"); // InsertWordsToDB.insertManyWords(AllWords.WORDS);

### View the demo here: https://word.es9.app
# Happy Wordling!

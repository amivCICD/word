package com.chicwordle.refactorserver.service;

import java.nio.file.Path;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.chicwordle.refactorserver.domain.WordOfDayResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WordService {
    private final String sqliteUrl;
    private final ObjectMapper objectMapper;
    private String dailyWord;
    private LocalDate lastGeneratedDate;
    private static final String DICTIONARY_API = "https://dictionaryapi.com/api/v3/references/thesaurus/json/";
    private static final String DICTIONARY_API_KEY = "?key=d465c9ab-7253-4549-aa42-8700856c931d";

    public WordService(@Value("${app.sqlite.path}") String sqlitePath, ObjectMapper objectMapper) {
        this.sqliteUrl = "jdbc:sqlite:" + Path.of(sqlitePath).normalize();
        this.objectMapper = objectMapper;
    }

    public WordOfDayResponse getWordOfTheDay() {
        LocalDate today = LocalDate.now();
        if (dailyWord != null && today.equals(lastGeneratedDate)) {
            return new WordOfDayResponse(dailyWord);
        }

        String selectSql = "SELECT id, word FROM words WHERE used != 1 ORDER BY RANDOM() LIMIT 1;";
        String updateSql = "UPDATE words SET used = 1 WHERE id = ?;";

        try (
            Connection connection = DriverManager.getConnection(sqliteUrl);
            PreparedStatement selectStatement = connection.prepareStatement(selectSql);
            var resultSet = selectStatement.executeQuery()
        ) {
            if (!resultSet.next()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No unused words available");
            }

            int id = resultSet.getInt("id");
            dailyWord = resultSet.getString("word");
            lastGeneratedDate = today;

            try (PreparedStatement updateStatement = connection.prepareStatement(updateSql)) {
                updateStatement.setInt(1, id);
                updateStatement.executeUpdate();
            }

            return new WordOfDayResponse(dailyWord);
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to load word of the day", exception);
        }
    }

    public String getRandomRoomWord() {
        String sql = "SELECT word FROM words ORDER BY RANDOM() LIMIT 1;";

        try (
            Connection connection = DriverManager.getConnection(sqliteUrl);
            PreparedStatement statement = connection.prepareStatement(sql);
            var resultSet = statement.executeQuery()
        ) {
            if (!resultSet.next()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No words available");
            }
            return resultSet.getString("word");
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to load room word", exception);
        }
    }

    public boolean isValidGuess(String guess) {
        String sql = "SELECT COUNT(*) AS count FROM words WHERE LOWER(word) = LOWER(?)";

        try (
            Connection connection = DriverManager.getConnection(sqliteUrl);
            PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.setString(1, guess);
            try (var resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getInt("count") > 0;
            }
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to validate guess", exception);
        }
    }

    public List<String> getDefinition(String word) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(DICTIONARY_API + word.toLowerCase() + DICTIONARY_API_KEY))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            List<String> definitions = new ArrayList<>();

            if (!root.isArray() || root.isEmpty()) {
                definitions.add("No definition found");
                return definitions;
            }

            JsonNode first = root.get(0);
            JsonNode shortDef = first.get("shortdef");
            if (shortDef != null && shortDef.isArray()) {
                shortDef.forEach(node -> definitions.add(node.asText()));
            }

            if (definitions.isEmpty()) {
                definitions.add("No definition found for this word.");
            }

            return definitions;
        } catch (Exception exception) {
            return List.of("Definition unavailable");
        }
    }
}

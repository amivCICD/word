package com.chicwordle.server;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Connection;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;


public class SQLiteSelect {

    public static Map<Integer, String> selectWordOfDay() {
        String url = "jdbc:sqlite:chicwordle.db";
        String sql = "SELECT * FROM words WHERE used != 1 ORDER BY RANDOM() LIMIT 1;";
        Map<Integer, String> wordAndId = new HashMap<>();

        try (Connection conn = DriverManager.getConnection(url);
            Statement stmt = conn.createStatement();
            var rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    System.out.printf("%-5s%-25s%-10s%n",
                        rs.getInt("id"),
                        rs.getString("word"),
                        rs.getBoolean("used")
                    );
                    int id = rs.getInt("id");
                    String word = rs.getString("word");
                    wordAndId.put(id, word);
                }
            } catch (SQLException e) {
                System.err.println(e.getMessage());
            }
            return wordAndId;
    }
}
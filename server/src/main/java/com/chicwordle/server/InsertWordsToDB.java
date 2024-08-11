package com.chicwordle.server;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Connection;
import java.sql.PreparedStatement;
// import com.chicwordle.server.WORDS;

public class InsertWordsToDB {
    static void insertManyWords(String[] allWords) {
        String url = "jdbc:sqlite:chicwordle.db";
        String sql = "INSERT INTO words (word) VALUES (?);";

        try (Connection conn = DriverManager.getConnection(url);
            PreparedStatement pstmt = conn.prepareStatement(sql)) {

                conn.setAutoCommit(false);

                for (int i = 0; i < allWords.length; i++) {
                    pstmt.setString(1, allWords[i]);
                    // pstmt.executeUpdate();
                    pstmt.addBatch();

                    if (i % 500 == 0 || i == allWords.length - 1) {
                        pstmt.executeBatch();
                        conn.commit();
                    }
                }
                System.out.println("Words successfully inserted into chicwordle.db!");
        } catch (SQLException e) {
            System.err.println(e.getMessage());
        }
    }
}
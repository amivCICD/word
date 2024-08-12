package com.chicwordle.server;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Connection;
import java.sql.Statement;
import java.sql.PreparedStatement;


public class SQLiteUpdate {

    public static void updateWordAsUsed(int id) {
        String url = "jdbc:sqlite:chicwordle.db";
        String sql = "UPDATE words SET used = ? WHERE id = ?";
        int boolVal = 1;

        try (Connection conn = DriverManager.getConnection(url);
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setInt(1, boolVal);
                pstmt.setInt(2, id);
                pstmt.executeUpdate();
            } catch (SQLException e) {
                System.err.println(e.getMessage());
        }
    }
}
package com.chicwordle.server;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Connection;
import java.sql.Statement;

public class SQLiteCreateTable {

    public static void createWordTable(String tableName) {
        var url = "jdbc:sqlite:chicwordle.db";
        var sql = "CREATE TABLE IF NOT EXISTS " + tableName + " ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "word VARCHAR(5), "
                + "used BOOLEAN DEFAULT FALSE"
                + ");";
        try (Connection conn = DriverManager.getConnection(url);
        Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        }
    }
}
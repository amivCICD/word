package com.chicwordle.server;

import java.sql.DriverManager;
import java.sql.SQLException;

public class CreateDB {
    static void initDB() {
        String url = "jdbc:sqlite:chicwordle.db";
        try (var conn = DriverManager.getConnection(url)) {
            if (conn != null) {
                var meta = conn.getMetaData();
                System.out.println("The driver name is: " + meta.getDriverName());
                System.out.println("A new database has been created");
            }
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        }
    }
}
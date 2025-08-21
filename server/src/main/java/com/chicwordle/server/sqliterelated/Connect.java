package com.chicwordle.server.sqliterelated;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Connect {
	public static void connect() {
		Connection conn = null;
		try {
				String url = "jdbc:sqlite:sqlite-sakila.db";
				conn = DriverManager.getConnection(url);
				System.out.println("Connection to SQLite successful...");
		} catch (SQLException e) {
				System.out.println(e.getMessage());
		} finally {
				try {
					if (conn != null) {
						conn.close();
					}
				} catch(SQLException ex) {
						System.out.println(ex.getMessage());
				}
		}
	}
}
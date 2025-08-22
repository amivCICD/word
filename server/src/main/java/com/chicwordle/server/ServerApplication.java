package com.chicwordle.server;

import java.io.File;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.chicwordle.server.data.AllWords;
import com.chicwordle.server.sqliterelated.Connect;
import com.chicwordle.server.sqliterelated.CreateDB;
import com.chicwordle.server.sqliterelated.InsertWordsToDB;
import com.chicwordle.server.sqliterelated.SQLiteCreateTable;
import com.chicwordle.server.sqliterelated.SQLiteSelect;

@SpringBootApplication
public class ServerApplication {
	private static String dbPath = "../../../../../../../chicwordle.db";
	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
		File dbFile = new File(dbPath);
		if (!dbFile.exists()) {
			System.out.println("dbFile.exists()\t" + dbFile.exists());
			System.out.println("Generating database...");
			Connect.connect(); // these were commented out from last build 30-34
			CreateDB.initDB();
			SQLiteCreateTable.createWordTable("words");
			InsertWordsToDB.insertManyWords(AllWords.WORDS);
		} else {
			System.out.println("DB Exists!");
		}
		SQLiteSelect.selectWordOfDay();
	}
}





package com.chicwordle.server;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.chicwordle.server.data.AllWords;
import com.chicwordle.server.sqliterelated.Connect;
import com.chicwordle.server.sqliterelated.CreateDB;
import com.chicwordle.server.sqliterelated.InsertWordsToDB;
import com.chicwordle.server.sqliterelated.SQLiteCreateTable;
import com.chicwordle.server.sqliterelated.SQLiteSelect;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class ServerApplication {
	@Value("${app.dbPath}")
	private String dbPath;
	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}
	@PostConstruct
	public void init() {
		File dbFile = new File(dbPath);
		// System.out.println("@@@@@@@@@@@@@@@@SQLite DB Path@@@@@@@@@@@@@@@@@@@@@\t" + dbFile.getAbsolutePath());
		try {
			if (!dbFile.exists()) {
				System.out.println("DB does not Exist! Generating database...");
				Connect.connect(); // these were commented out from last build 30-34
				CreateDB.initDB();
				SQLiteCreateTable.createWordTable("words");
				InsertWordsToDB.insertManyWords(AllWords.WORDS);
			} else {
				System.out.println("dbFile.exists()\t" + dbFile.exists());
			}
			SQLiteSelect.selectWordOfDay();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}





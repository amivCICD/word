package com.chicwordle.server.playerdata;


public class User implements UserInterface {
    private String username;
    private String userId;

    public User(String username, String userId) {
        this.username = username;
        this.userId = userId;
    };
    @Override
    public String getName(){
        return this.username;
    }
    @Override
    public void setName(String username){
        this.username = username;
    }
    @Override
    public String getUserId(){
        return this.userId;
    }
    @Override
    public void setUserId(String userId){
        this.userId = userId;
    }
}
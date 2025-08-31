package com.chicwordle.server.wotddefinition;

import java.util.List;

import org.json.JSONArray;


public interface WordDefinitionInterface {
    public List<String> getDefinition();
    public void setDefinition(List<String> wotd_def);
    public void fetchDefinition() throws Exception;
    public List<String> parseDefinition(JSONArray root);
}
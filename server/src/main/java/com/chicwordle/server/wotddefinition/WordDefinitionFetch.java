package com.chicwordle.server.wotddefinition;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

public class WordDefinitionFetch implements WordDefinitionInterface {
    private final String dictionaryAPI = "https://dictionaryapi.com/api/v3/references/thesaurus/json/";
    private final String api_key = "?key=d465c9ab-7253-4549-aa42-8700856c931d";
    private final String wotd;
    private List<String> wotd_definition;

    public WordDefinitionFetch(String wotd) {
        this.wotd = wotd;
    }
    @Override
    public List<String> getDefinition() {
        return wotd_definition;
    }
    @Override
    public void setDefinition(List<String> wotd_def) {
        this.wotd_definition = wotd_def;
    }
    @Override
    public void fetchDefinition() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(dictionaryAPI + wotd + api_key))
            .build();

        HttpResponse<String> response =
            client.send(request, HttpResponse.BodyHandlers.ofString());
        JSONArray root = new JSONArray(response.body());
        // JSONObject firstEntry = root.getJSONObject(0);
        // JSONArray shortDef = firstEntry.getJSONArray("shortdef");
        // for (int i=0; i<shortDef.length(); i++) {
        //     defs.add(shortDef.getString(i));
        // }
        List<String> defs = parseDefinition(root);
        setDefinition(defs);
    }
    public List<String> parseDefinition(JSONArray root) {
        List<String> defs = new ArrayList<>();
        if (root.isEmpty()) {
            defs.add("No definition found");
            return defs;
        }
        Object first = root.get(0);
        if (first instanceof JSONObject) {
            JSONObject firstEntry = (JSONObject) first;
            JSONArray shortDef = firstEntry.optJSONArray("shortdef");
            if (shortDef != null) {
                for (int i=0; i<shortDef.length(); i++) {
                    defs.add(shortDef.getString(i));
                }
            } else {
                defs.add("No short definition found.");
            }
        } else if (first instanceof String) {
            defs.add("No definition found for this word.");
        }
        return defs;
    }
}
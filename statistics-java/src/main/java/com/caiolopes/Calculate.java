package com.caiolopes;

import com.mongodb.*;
import org.json.*;
import java.util.*;
import java.io.*;
import java.text.SimpleDateFormat;
import java.text.ParseException;

public class Calculate {

	public static void main(String args[]) throws Exception {
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
		MongoClient mongoClient = new MongoClient("localhost", 27017);

		DB db = mongoClient.getDB("stackoverflow");
		DBCollection frequent = db.getCollection("Frequent");
		DBCollection postTag = db.getCollection("Post_tag");
		DBCollection posts = db.getCollection("Posts");

		BasicDBObject queryFrequent = new BasicDBObject();
		queryFrequent.put("tags", new BasicDBObject("$size", 2));

		DBCursor cursorFrequent = frequent.find(queryFrequent); 
		cursorFrequent.addOption(com.mongodb.Bytes.QUERYOPTION_NOTIMEOUT);

		try {
			while(cursorFrequent.hasNext()) {
				DBObject frequentDbObj = cursorFrequent.next();
				JSONObject obj = new JSONObject(frequentDbObj.toString());
				System.out.println(obj.getJSONArray("tags").getString(0) + ", " + obj.getJSONArray("tags").getString(1));

				BasicDBObject andQuery = new BasicDBObject();
				List<BasicDBObject> andList = new ArrayList<BasicDBObject>();
				List<Integer> idList = new ArrayList<Integer>();
				andList.add(new BasicDBObject("tags", obj.getJSONArray("tags").getString(0)));
				andList.add(new BasicDBObject("tags", obj.getJSONArray("tags").getString(1)));
				andQuery.put("$and", andList);

				DBCursor cursor = postTag.find(andQuery);

				ArrayList<Date> dateArray = new ArrayList<Date>();

				while (cursor.hasNext()) {
					JSONObject postObj = new JSONObject(cursor.next().toString());
					BasicDBObject query = new BasicDBObject("_id", postObj.getString("_id"));
					DBCursor postCursor = posts.find(query);
					if (postCursor.hasNext()) {
						JSONObject post = new JSONObject(postCursor.next().toString());
						//System.out.println(post.getString("CreationDate"));
						dateArray.add(formatter.parse(post.getString("CreationDate")));
					}
				}
				Collections.sort(dateArray);  // Native sort for Date is chronological
				ArrayList<String> dateArrayStr = new ArrayList<String>();
				for (int i = 0; i < dateArray.size(); i++) {
					Date date = dateArray.get(i);
					dateArrayStr.add(formatter.format(date));
				}
				BasicDBObject newFrequentObj = new BasicDBObject(frequentDbObj.toMap());
				newFrequentObj.append("CreationDateArray", dateArrayStr);
				System.out.println((frequent.update(frequentDbObj, newFrequentObj)).toString());
			}
		} finally {
		   cursorFrequent.close();
		}
	}
}
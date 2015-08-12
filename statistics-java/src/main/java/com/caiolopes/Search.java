package com.caiolopes;

import com.mongodb.*;
import org.json.*;
import java.util.*;
import java.io.*;

public class Search {

	public static void readFile(HashMap map, String filename) throws FileNotFoundException, IOException {
		try(BufferedReader br = new BufferedReader(new FileReader(filename))) {
			String line = br.readLine();

			while (line != null) {
				map.put(line, line);
				line = br.readLine();
			}
		}
	}

	public static void printMap(Map mp) {
	    Iterator it = mp.entrySet().iterator();
	    while (it.hasNext()) {
	        Map.Entry pair = (Map.Entry)it.next();
	        System.out.println(pair.getKey() + ", " + pair.getValue());
	        it.remove(); // avoids a ConcurrentModificationException
	    }
	}

	public static <K, V extends Comparable<? super V>> Map<K, V> 
	    sortByValue( Map<K, V> map )
	{
	    List<Map.Entry<K, V>> list =
	        new LinkedList<>( map.entrySet() );
	    Collections.sort( list, new Comparator<Map.Entry<K, V>>()
	    {
	        @Override
	        public int compare( Map.Entry<K, V> o1, Map.Entry<K, V> o2 )
	        {
	            return (o2.getValue()).compareTo( o1.getValue() );
	        }
	    } );

	    Map<K, V> result = new LinkedHashMap<>();
	    for (Map.Entry<K, V> entry : list)
	    {
	        result.put( entry.getKey(), entry.getValue() );
	    }
	    return result;
	}

	public static void main(String args[]) throws Exception { 
		if (args.length > 0) {
			HashMap<String, String> plMap = new HashMap<>();
			HashMap<String, String> dbMap = new HashMap<>();
			Map<String, Integer> resultDbMap = new HashMap<String, Integer>();
			Map<String, Integer> resultPlMap = new HashMap<String, Integer>();
			readFile(plMap, "pl-list.txt");
			readFile(dbMap, "db-list.txt");

			MongoClient mongoClient = new MongoClient("localhost", 27017);

			DB db = mongoClient.getDB("stackoverflow");
			DBCollection coll = db.getCollection("Frequent");

			BasicDBObject query = new BasicDBObject("tags", args[0]);

			DBCursor cursor = coll.find(query);

			try {
				while(cursor.hasNext()) {
					JSONObject obj = new JSONObject(cursor.next().toString());
					JSONArray arr = obj.getJSONArray("tags");
					for (int i = 0; i < arr.length(); i++) {
						if (plMap.containsKey(arr.getString(i))) {
							Integer previousValue = resultPlMap.get(arr.getString(i));
							resultPlMap.put(arr.getString(i), previousValue == null ? obj.getInt("counter") : previousValue + obj.getInt("counter"));						} 
						if (dbMap.containsKey(arr.getString(i))) {
							Integer previousValue = resultDbMap.get(arr.getString(i));
							resultDbMap.put(arr.getString(i), previousValue == null ? 1 : previousValue + 1);
						}
					}
				}
			} finally {
			   cursor.close();
			}
			System.out.println("Programming Languages:");
			printMap(sortByValue(resultPlMap));
			System.out.println("\nDatabases:");
			printMap(sortByValue(resultDbMap));
		} else {
			System.out.println("Usage: java -jar search.jar com.caiolopes.Search tag");
		}
	}
}
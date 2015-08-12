import xml.parsers.expat
import pymongo, json

# Each of our data files which will be used as collection names also.
files = [ "Tags", "Users", "Badges", "PostLinks", "Votes", "Comments", "Posts", "PostHistory"]

client = pymongo.MongoClient("localhost", 27017)

# Name our database, can change this for Server Fault/etc..
db = client.stackoverflow

for file in files:

  print ("init import: %s.xml" % file)

  def start_element(name, attrs):
    if u'Id' in attrs:
      attrs['_id'] = attrs[u'Id']
      del attrs[u'Id']

    db[file].insert( attrs )

  def start_element_normalize(name, attrs):
    if u'Id' in attrs:
      attrs['_id'] = attrs[u'Id']
      del attrs[u'Id']

      db[file].insert( attrs )

      d = json.loads(json.dumps(attrs))
      if d.get('Tags'):
        tags = d['Tags'].split(">")
        tagArr = []
        for tag in tags:
          if (tag[1:] != ""):
            tagArr.append(tag[1:]);
        
        db.Post_tag.insert( { '_id' : d['_id'], 'tags' : tagArr } )

  parser = xml.parsers.expat.ParserCreate()
  if (file == "Posts"):
    parser.StartElementHandler = start_element_normalize
    parser.ParseFile( open( file + ".xml", "r") )
  else:
    parser.StartElementHandler = start_element
    parser.ParseFile( open( file + ".xml", "r") )

  print ("imported %s %s" % ( db[file].count() , files ))
  print ("finished import: %s.xml" % file)
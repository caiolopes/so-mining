// Pre-processing all tags for running the FP Growth Algorithm
// It is going to print one post per line with all the tags of this post separeted by a space
var cursor = db.Post_tag.find();
for (var i = 0; cursor.hasNext(); i++) {
	var obj = cursor.next();
	if (obj.tags.length > 1) {
		var tags = obj.tags[0];
		tags = tags.concat(" ");
		for (var j = 1; j < obj.tags.length; j++) {
			if (obj !=  obj.tags.length-1) {
				tags = tags.concat(obj.tags[j]+ " ");
			} else {
				tags = tags.concat(obj.tags[j]);
			}
		}
		print(tags);
	}
}
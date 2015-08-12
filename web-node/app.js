var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var assert = require('assert');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//require("./routes/main")(app);

// set up the routes themselves
app.get("/", function (req, res) {
    res.render('index', { title: 'StackOverFlow Mining' });
});

app.post("/tag", function (req, res) {
    searchTag(req.body.tag, res);
});

app.post('/search', function(req, res) {
  searchFrequent(req.body.tag, res);
});

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert')
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/stackoverflow';

var totalCategories = 8;
var categoriesNames = ["\"Programming Languages\"", "\"Databases\"", "\"Text editors and IDEs\"", "\"Frameworks\"", 
                        "\"Libraries\"", "\"Data Interchange\"", "\"Tools\"", "\"APIs\""];


var file;
var hashMaps = {};

for (var i = 0; i < totalCategories; i++) {
    hashMaps[i] = {};
}

file = require('./lists/pl-list.json');
for (var obj in file.array)
    hashMaps[0][file.array[obj]] = file.array[obj];

file = require('./lists/db-list.json');
for (var obj in file.array)
    hashMaps[1][file.array[obj]] = file.array[obj];

file = require('./lists/texteditor-ide-list.json');
for (var obj in file.array)
    hashMaps[2][file.array[obj]] = file.array[obj];

file = require('./lists/framework-list.json');
for (var obj in file.array)
    hashMaps[3][file.array[obj]] = file.array[obj];

file = require('./lists/library-list.json');
for (var obj in file.array)
    hashMaps[4][file.array[obj]] = file.array[obj];

file = require('./lists/data-interchange-list.json');
for (var obj in file.array)
    hashMaps[5][file.array[obj]] = file.array[obj];

file = require('./lists/tool-list.json');
for (var obj in file.array)
    hashMaps[6][file.array[obj]] = file.array[obj];

file = require('./lists/api-list.json');
for (var obj in file.array)
    hashMaps[7][file.array[obj]] = file.array[obj];

function highest() { 
  return [].slice.call(arguments).sort(function(a,b){ 
    return b - a; 
  }); 
}

function searchFrequent(tag, res) {
    var results = {};
    for (var i = 0; i < totalCategories; i++) {
        results[i] = {};
    }
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var cursor = db.collection('Frequent').find( { tags:tag } );
        cursor.each(function(err, doc) {
          assert.equal(err, null);
          if (doc != null) {
             var arr = doc.tags;
             for (var i = 0; i < arr.length; i++) {
                for (var j = 0; j < totalCategories; j++) {
                    if (hashMaps[j][arr[i]] != undefined) {
                        var previousCounter = results[j][arr[i]];
                        if (previousCounter == undefined)
                            results[j][arr[i]] = doc.counter;
                        else
                            results[j][arr[i]] = previousCounter + doc.counter;
                    }
                }
             }
          } else {
            var chartTitle = "Results for: " + tag;
            var resp = {};
            for (var i = 0; i < totalCategories; i++) {
                resp[i] = "dataPoints: [";     
                var sortable = [];
                for (var obj in results[i]) {
                    if (obj != 'constructor')
                        sortable.push([obj, results[i][obj]]);
                }

                sortable.sort(function(a, b) {return b[1] - a[1]})

                var j = 0;
                for (var key in sortable) {
                    if (j >= 5)
                        break;
                    //resp = resp.concat(sortable[key][0]+", " + sortable[key][1]+"<br />");
                    if (j < 4)
                        resp[i] = resp[i].concat("{ y: "+sortable[key][1]+", label: \"" + sortable[key][0]+"\"}, ");
                    else
                        resp[i] = resp[i].concat("{ y: "+sortable[key][1]+", label: \"" + sortable[key][0]+"\"}");
                    j++;
                }
                resp[i] = resp[i].concat("]");
             }
            res.render('search', { title: chartTitle, categories: categoriesNames, content: resp });
            db.close();
          }
        });
    });
}

function searchTag(tag, res) {
    var postsId = [];
    var sum = 0;
    var total = 0;

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var cursor = db.collection('Post_tag').find( { tags:tag } );
        cursor.each(function(err, doc) {
          assert.equal(err, null);
          if (doc != null) {
            postsId.push(doc._id);
          } else {
            cursor = db.collection('Posts').find( { _id: { $in: postsId } } );
            cursor.each(function(err, doc) {
              assert.equal(err, null);
              if (doc != null) {
                if (doc.AnswerCount != undefined) {
                    sum += parseInt(doc.AnswerCount);
                }
                if (doc.AcceptedAnswerId != undefined) {
                    var num = parseInt(doc.AcceptedAnswerId);
                    if (num > 0) {
                        total++;
                    }
                }
              } else {
                res.render('tag', { 
                    tag: tag, 
                    averageAnswers: sum/postsId.length, 
                    averageAcceptedAnswers: total/postsId.length 
                });
                db.close();
              }
            });
          }
        });
    });
}

//module.exports = app;


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});
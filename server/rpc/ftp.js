// Server-side Code

// Define actions which can be called from the client using ss.rpc('ftp.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

  // Example of pre-loading sessions into req.session using internal middleware
  req.use('session');

  // Uncomment line below to use the middleware defined in
  // server/middleware/example
  // req.use('example.authenticated')

  return {

    getList : function() {
      getList(function(err, list) {
        if (err)
          return ss.publish.all('newList', err);
        ss.publish.all('newList', null, list);
      });
      return res(true);
    },

    download : function(filenames) {
      download(filenames, function(err, csvfile) {
        if (err) {
          ss.publish.all('download', err);
          return res(false);
        }
        console.log('csvfile : ', csvfile);
        ss.publish.all('download', null, csvfile);
      });
      return res(true);
    }

  };

};

var async = require('async');
var util = require('util');
var fs = require('fs');
var Ftp = require('ftp');
var zlib = require('zlib');
var conn;

var firewall = 'inet-gw.tis.toshiba.co.jp';
var host = 'aftp.linksynergy.com';
var user = 'mash180sx';
var pass = '72CHbrCS';
var auth = (firewall) ? user + '@' + host : user;

function formatDate(d) {
  return (d.year < 10 ? '0' : '') + d.year + '-' + (d.month < 10 ? '0' : '')
      + d.month + '-' + (d.date < 10 ? '0' : '') + d.date;
}

function getList(callback) {
  // new FTP client
  connect = new Ftp({
    host : firewall
  });

  console.log('ftp.connect.start');
  // FTP connect
  connect.connect();
  // connect listener 'connect'
  connect.on('connect', function() {
    // authentication
    connect.auth(auth, pass, function(err) {
      if (err)
        return callback(err);
      var list = new Array();
      // get list '*lmp'
      connect.list('*lmp', function(err, iter) {
        if (err)
          return callback(err);
        var begin = false;
        iter.on('entry', function(entry) {
          if (!begin) {
            begin = true;
            console.log('<start of directory list>');
          }
          if (entry.type === 'l')
            entry.type = 'LINK';
          else if (entry.type === '-')
            entry.type = 'FILE';
          else if (entry.type === 'd')
            entry.type = 'DIR.';
          console.log(' ' + entry.type + ' ' + entry.size + ' '
              + formatDate(entry.date) + ' ' + entry.name);
          list.push({
            filename : entry.name.replace('.lmp', '')
          });
          // console.log(connect.entry);
        });
        iter.on('raw', function(s) {
          console.log('<raw entry>: ' + s);
        });
        iter.on('end', function() {
          console.log('<end of directory list>');
        });
        iter.on('error', function(err) {
          console.log('ERROR during list(): ' + util.inspect(err));
          connect.end();
          callback(err);
        });
        iter.on('success', function() {
          connect.end();
          callback(null, list);
        });
      });
    });
  });
  // connect listener 'end'
  connect.on('end', function() {
    console.log('ftp.close');
    // connect.end();
    delete connect;
  });
}

function download(filenames, callback) {
  // new FTP client
  connect = new Ftp({
    host : firewall
  });

  console.log('ftp.connect.start');
  // FTP connect
  connect.connect();
  // connect listener 'connect'
  connect.on('connect', function() {
    // authentication
    connect.auth(auth, pass, function(err) {
      if (err) {
        console.log('auth error');
        return callback(err);
      }

      // download filenames & ungzip
      async.mapSeries(filenames, function(file, callback) {
        var csv = file.replace('.gz', '');
        connect.get(file, function(err, stream) {
          if (err) {
            console.log('get error');
            return callback(err);
          }

          var os = fs.createWriteStream(csv);
          // stream listener 'success'
          stream.on('success', function() {
            console.log('download success : ' + file);
            // this function callback(null, csv)
            callback(null, {
              filename : csv
            });
          })
          // stream listener 'error'
          .on('error', function(err) {
            console.log('ERROR during get(): ' + util.inspect(err));
            callback(err);
          })
          // stream pipeline (ftp->gunzip->csv)
          .pipe(zlib.createGunzip()).pipe(os)
          // stream.pipe(..).pipe(..) listener 'close'
          .on('close', function() {
            console.log('csv close' + csv);
          });
        });
      }, function(err, results) {
        console.log('all done or error');
        connect.end();
        if (err)
          return callback(err);
        callback(null, results);
      });
    });
  });
  // connect listener 'end'
  connect.on('end', function() {
    console.log('ftp.close');
    // connect.end();
    delete connect;
  });
}

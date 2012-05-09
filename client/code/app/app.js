// NOTICE: server event list
// Listen out for newList events coming from the server
ss.event.on('newList', function(err, list) {

  if (err) {
    $('#status').text('Oops! Unable to get list');
    return false;
  }

  // Example of using the Hogan Template in client/templates/chat/message.jade
  // to generate HTML for each message
  var html = ss.tmpl['ftp-main'].render({
    status : 'Select download file',
    list : list,
    buttonName : 'download',
  });

  // Append it to the #chatlog div and show effect
  $('#demo').replaceWith(html);
  // download list
  $(':button').on('click', function() {
    var filenames = new Array();
    $(':checkbox').each(function(index) {
      if ($(this).attr('checked') === 'checked')
        filenames.push($(this).val());
    });
    if (filenames.length > 0) {
      var html = ss.tmpl['ftp-main'].render({
        status : 'Now downloading files',
      });

      // Append it to the #chatlog div and show effect
      $('#demo').replaceWith(html);

      exports.download(filenames, function(success) {
        if (success) {
          $('#status').text('Now downloading files');
        } else {
          $('#status').text('Oops! Unable to download files');
        }
      });
    } else {
      alert('Please select download file!');
    }
    return false;
  });

  return false;
});
// Listen out for download events coming from the server
ss.event.on('download', function(err, csvfile) {

  if (err) {
    $('#status').text('Oops! Unable to download files');
    return false;
  }

  // Example of using the Hogan Template in client/templates/chat/message.jade
  // to generate HTML for each message
  var html = ss.tmpl['ftp-main'].render({
    status : 'download csvfile list',
    csvfile : csvfile,
    buttonName : 'get list',
  });

  // Append it to the #chatlog div and show effect
  $('#demo').replaceWith(html);
  $(':button').on('click', function() {
    exports.init();
  });

  return false;
});

// NOTICE: Private functions
var timestamp = function() {
  var d = new Date();
  return d.getHours() + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
};

var pad2 = function(number) {
  return (number < 10 ? '0' : '') + number;
};

var valid = function(text) {
  return text && text.length > 0;
};

// getList function
exports.getList = function(cb) {
  return ss.rpc('ftp.getList', cb);
};

// download function
exports.download = function(filenames, cb) {
  return ss.rpc('ftp.download', filenames, cb);
};

// initialize function
exports.init = function() {
  // Example of using the Hogan Template in client/templates/chat/message.jade
  // to generate HTML for each message
  var html = ss.tmpl['ftp-main'].render();

  // Append it to the #chatlog div and show effect
  $('#demo').replaceWith(html);

  // Call the 'getList' funtion (below) to ensure it's valid before sending to
  // the server
  exports.getList(function(success) {
    if (success) {
      $('#status').text('Now get download list');
    } else {
      $('#status').text('Oops! Unable to get list');
    }
  });
  return false;
};
(function() {
  exports.init();
})();

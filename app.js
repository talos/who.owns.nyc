var rows = [];

var search = function (evt) {
  evt.stopPropagation();
  var borough = $('#borough').val();
  var block = $('#block').val();
  var lot = $('#lot').val();

  // Obtain property JSON
  $.ajax({
    url: "http://data.cityofnewyork.us/resource/8h5j-fqxa.json?$where=borough=" +
      borough + "%20and%20block=" + block + "%20and%20lot=" + lot,
    jsonp: "$jsonp",
    dataType: "jsonp"
  }).done(function(data) {
    //Array.prototype.push.apply(rows, data);
    $('#output').text(JSON.stringify(data));

    // TODO: obtain master and party data from this
  });
  return false;
};

$(document).ready(function () {
  $('#form').on('submit', search);
});

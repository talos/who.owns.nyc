/** @jsx React.DOM */
"use strict";

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
    //$('#output').text(JSON.stringify(data));

    var where = [];
    var i = 0;
    for (i = 0; i < data.length; i++) {
      where.push("document_id='" + data[i].document_id + "'");
    }

    where = where.join(' OR ');

    var master = $.ajax({
      url: "http://data.cityofnewyork.us/resource/bnx9-e6tj.json?$where=" + where,
      jsonp: "$jsonp",
      dataType: "jsonp"
    });

    var parties = $.ajax({
      url: "http://data.cityofnewyork.us/resource/636b-3b5g.json?$where=" + where,
      jsonp: "$jsonp",
      dataType: "jsonp"
    });

    var j = 0;
    $.when(master, parties).done(function (masterResp, partiesResp) {
      var masterData = masterResp[0],
          partiesData = partiesResp[0];
      for (i = 0; i < masterData.length; i++) {
        for (j = 0; j < data.length; j++) {
          if (masterData[i].document_id === data[j].document_id) {
            for (var k in masterData[i]) {
              data[j][k] = masterData[i][k];
            }
          }
        }
      }
      for (i = 0; i < partiesData.length; i++) {
        for (j = 0; j < data.length; j++) {
          if (partiesData[i].document_id === data[j].document_id) {
            for (var k in partiesData[i]) {
              var outK = 'party' + partiesData[i].party_type + '.' + k;
              if (outK in data[j]) {
                data[j][outK] += ', ' + partiesData[i][k];
              } else {
                data[j][outK] = partiesData[i][k];
              }
            }
          }
        }
      }
      var Table = Reactable.Table;
      /*jshint ignore:start*/
      var table = React.render(
        <Table className="table" data={data} />,
        document.getElementById('data')
      );
      /*jshint ignore:end*/
    });

  });
  return false;
};

$(document).ready(function () {
  $('#form').on('submit', search);
});

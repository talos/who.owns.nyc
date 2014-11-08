/** @jsx React.DOM */
/*jslint plusplus:true, camelcase:false, strict:false, browser:true,
 maxstatements:40, maxdepth:10, unused:false*/
/*globals $, React*/

(function () {
"use strict";

var geoclient = function (endpoint) {
  return function (data) {
    var $dfd = new $.Deferred();
    $.ajax({
      url: '/geoclient/' + endpoint + '.json',
      method: 'GET',
      data: data
    }).done(function (resp) {
      var data = resp[endpoint];
      if (data.message) {
        $dfd.reject(data);
      } else {
        $dfd.resolve(data);
      }
    }).fail(function (jqXHR) {
      $dfd.reject(JSON.parse(jqXHR.responseText));
    });

    return $dfd.promise();
  };
};

/**
 * This function takes a raw address and splits it into houseNumber, street,
 * and borough components.
 *
 * The additional args by default are undefined, and will be overriden even if
 * set.
 */
var splitAddress = function (rawAddress, houseNumber, street, borough) {
  var retObj = {};

  // Assume anything after the first comma is a borough -- kill beyond
  // second comma.  Also reduce rawAddress.
  if (rawAddress.indexOf(',') !== -1) {
    borough = rawAddress.slice(rawAddress.indexOf(',') + 1);
    rawAddress = rawAddress.slice(0, rawAddress.indexOf(','));
    if (borough.indexOf(',') !== -1) {
      borough = borough.slice(0, borough.indexOf(','));
    }
    borough = borough.trim();
  }

  var splitAddress = rawAddress.split(/\s+/);
  houseNumber = splitAddress.shift();
  street = splitAddress.join(' ');

  if (typeof houseNumber !== 'undefined' && houseNumber !== '') {
    retObj.houseNumber = houseNumber;
  }
  if (typeof street !== 'undefined' && street !== '') {
    retObj.street = street;
  }
  if (typeof borough !== 'undefined') {
    retObj.borough = borough;
  }

  return retObj;
};

var AddressBar = React.createClass({

  onAddressChange: function (/*evt*/) {
    var rawAddress = this.refs.address.getDOMNode().value;
    this.props.onInputChange(splitAddress(rawAddress));
  },

  address: function () {
    var input = this.props.input;
    var address = '';
    var trailingChar = '';
    if (this.refs.address) {
      trailingChar = this.refs.address.getDOMNode().value.slice(-1);
      if (trailingChar !== ' ' && trailingChar !== ',') {
        trailingChar = '';
      }
    }
    if (typeof input.houseNumber !== 'undefined') {
      address += input.houseNumber;
    }
    if (typeof input.street !== 'undefined') {
      address += address === '' ? '' : ' ';
      address += input.street;
    }
    if (typeof input.borough !== 'undefined') {
      address += address === '' ? '' : ',';
      if (input.borough !== '') {
        address += ' ' + input.borough;
      }
    }
    if (trailingChar !== '') {
      if (trailingChar !== ',' || input.borough !== '') {
        address = address.trim() + trailingChar;
      }
    }
    return address;
  },

  before: [geoclient('address')],

  validate: function () {
    var input = this.props.input;
    if (!input.houseNumber) {
      return "Missing house number.";
    } else if (!input.street) {
      return "Missing street name.";
    } else if (!input.borough) {
      return "Missing borough.";
    }
  },

  render: function () {
    /* jshint ignore:start */
    return (
      <div className="hint--bottom"
           data-hint={this.validate()}>
        <input name="address"
               className="form-control"
               ref="address"
               placeholder="Address"
               value={this.address()}
               onChange={this.onAddressChange} />
        <button type="submit" id="submit">Submit</button>
     </div>
    );
    /* jshint ignore:end */
  }

});


var search = function (evt) {
  evt.stopPropagation();
  var borough = $('#borough').val(),
      block = $('#block').val(),
      lot = $('#lot').val(),
      dataUrl = "https://data.cityofnewyork.us/resource/",
      legalsResource = "8h5j-fqxa",
      masterResource = "bnx9-e6tj",
      partiesResource = "636b-3b5g";

  // Obtain property JSON
  $.ajax({
    url: dataUrl + legalsResource + ".json?$where=borough=" +
      borough + "%20and%20block=" + block + "%20and%20lot=" + lot,
    jsonp: "$jsonp",
    dataType: "jsonp"
  }).done(function(data) {
    //Array.prototype.push.apply(rows, data);

    var where = [];
    var i = 0;
    for (i = 0; i < data.length; i++) {
      where.push("document_id='" + data[i].document_id + "'");
    }

    where = where.join(' OR ');

    var master = $.ajax({
      url: dataUrl + masterResource + ".json?$where=" + where,
      jsonp: "$jsonp",
      dataType: "jsonp"
    });

    var parties = $.ajax({
      url: dataUrl + partiesResource + ".json?$where=" + where,
      jsonp: "$jsonp",
      dataType: "jsonp"
    });

    var j = 0;
    $.when(master, parties).done(function (masterResp, partiesResp) {
      var masterData = masterResp[0],
          partiesData = partiesResp[0],
          k;
      for (i = 0; i < masterData.length; i++) {
        for (j = 0; j < data.length; j++) {
          if (masterData[i].document_id === data[j].document_id) {
            for (k in masterData[i]) {
              data[j][k] = masterData[i][k];
            }
          }
        }
      }
      for (i = 0; i < partiesData.length; i++) {
        for (j = 0; j < data.length; j++) {
          if (partiesData[i].document_id === data[j].document_id) {
            for (k in partiesData[i]) {
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
      /*jshint ignore:start*/
      var Table = Reactable.Table;
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
  /*jshint ignore:start*/
  React.render(
    <AddressBar input={{}} />,
    document.getElementById('form')
  );
  /*jshint ignore:end*/
});

}());

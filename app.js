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

var App = React.createClass({

  getInitialState: function () {
    return {
      mode: 'address',
      input: {
        address: {
          houseNumber: '993',
          street: 'Carroll St',
          borough: 'Brooklyn'
        },
        bbl: {
          borough: '3',
          block: '1772',
          lot: '74'
        },
        owner: {
          name: 'G-Way'
        }
      },
      data: []
    };
  },

  render: function () {
    /* jshint ignore:start */
    return (
      <div>
        <NavBar setMode={this.setMode} setInput={this.setInput}
                mode={this.state.mode} input={this.state.input}
                setData={this.setData} />
        <Results data={this.state.data} />
      </div>
    );
    /* jshint ignore:end */
  },

  setMode: function (newMode) {
    this.setState({mode: newMode});
  },

  setInput: function (newInput) {
    var obj = {input: this.state.input};
    obj.input[this.state.mode] = newInput;
    this.setState(obj);
  },

  setData: function (newData) {
    this.setState({data: newData});
  }

});

var Results = React.createClass({

  render: function () {

    /* jshint ignore:start */
    return (
      <Reactable.Table className="table" data={this.props.data}
             columns={["doc_type", "document_date", "document_amt", "party1.name", "party1.addr1", "party1.addr2", "party1.state", "party1.city", "party1.country", "party1.zip", "party2.name", "party2.addr1", "party2.addr2", "party2.city", "party2.country", "party2.zip"]}
             defaultSort={'recorded_datetime'}
             sortable={[ 'recorded_datetime', 'document_date']}
             filterable={["doc_type"]} />
    );
    /* jshint ignore:end */

  }

});

var NavBar = React.createClass({

  setMode: function (mode) {
    var self = this;
    return function (evt) {
      self.props.setMode(mode);
    };
  },

  setInput: function (newInput) {
    this.props.setInput(newInput);
  },

  onSubmit: function (evt) {
    evt.preventDefault();
    this.refs[this.props.mode].submit(evt);
  },

  render: function () {
    var mode = this.props.mode;
    /* jshint ignore:start */
    return (
      <nav className="navbar navbar-default" role="navigation">
        <div className="container">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand" href="#">
              Who owns NYC?
            </a>
          </div>

          <form ref="form" onSubmit={this.onSubmit}>
            <div className="collapse navbar-collapse" id="navbar-collapse">
              <ul className="nav navbar-nav">
                <li className={mode == 'address' ? 'active': ''}>
                  <a href="#" onClick={this.setMode('address')}>Address</a>
                </li>
                <li className={mode == 'owner' ? 'active': ''}>
                  <a href="#" onClick={this.setMode('owner')}>Owner</a>
                </li>
                <li className={mode == 'bbl' ? 'active': ''}>
                  <a href="#" onClick={this.setMode('bbl')}>BBL</a>
                </li>
                <li className={mode != 'address' ? 'hidden': ''}>
                  <AddressBar ref='address' setInput={this.setInput}
                              address={this.props.input.address}
                              setData={this.props.setData} />
                </li>
                <li className={mode != 'owner' ? 'hidden': ''}>
                  <OwnerBar ref='owner' setInput={this.setInput}
                            owner={this.props.input.owner}
                            setData={this.props.setData} />
                </li>
                <li className={mode != 'bbl' ? 'hidden': ''}>
                  <BBLBar ref='bbl' setInput={this.setInput}
                          bbl={this.props.input.bbl}
                          setData={this.props.setData} />
                </li>
                <li>
                  <button type="submit" id="submit">Submit</button>
                </li>
              </ul>
            </div>
          </form>
        </div>
      </nav>
    );
    /* jshint ignore:end */
  }

});

var OwnerBar = React.createClass({

  render: function () {

    /* jshint ignore:start */
    return (
      <div>
      </div>
    );
    /* jshint ignore:end */

  }

});

var BBLBar = React.createClass({

  validateBlock: function () {
    var block = this.props.bbl.block;
    block = Number(block);
    if (isNaN(block)) {
      return "Block must be a number";
    } else if (Math.floor(block) !== block) {
      return "Block must be an integer";
    } else if (block < 0) {
      return "Block must be positive";
    } else if (block > 99999) {
      return "Block must be less than 100000";
    }
  },

  validateLot: function () {
    var lot = this.props.bbl.lot;
    lot = Number(lot);
    if (isNaN(lot)) {
      return "Lot must be a number";
    } else if (Math.floor(lot) !== lot) {
      return "Lot must be an integer";
    } else if (lot < 0) {
      return "Lot must be positive";
    } else if (lot > 9999) {
      return "Lot must be less than 10000";
    }
  },

  onChange: function (evt) {
    var $target = $(evt.target),
        name = $target.attr('name'),
        val = $target.val();
    var obj = this.props.bbl;
    obj[name] = val;
    this.props.setInput(obj);
  },

  submit: function () {
    var self = this;
    search(this.props.bbl.borough,
           this.props.bbl.block,
           this.props.bbl.lot).done(function (data) {
             self.props.setData(data);
           });
  },

  render: function () {

    /* jshint ignore:start */
    return (
      <div>
        <select name="borough"
               className="form-control"
               ref="borough"
               value={this.props.bbl.borough}
               onChange={this.onChange}>
          <option value="2">Bronx</option>
          <option value="3">Brooklyn</option>
          <option value="1">Manhattan</option>
          <option value="4">Queens</option>
          <option value="5">Staten Island</option>
        </select>
        <div className="hint--bottom"
             data-hint={this.validateBlock()}>
          <input name="block"
                 className="form-control"
                 ref="address"
                 placeholder="Block"
                 value={this.props.bbl.block}
                 onChange={this.onChange} />
        </div>
        <div className="hint--bottom"
             data-hint={this.validateLot()}>
          <input name="borough"
                 className="form-control"
                 ref="address"
                 placeholder="Lot"
                 value={this.props.bbl.lot}
                 onChange={this.onChange} />
        </div>
      </div>
    );
    /* jshint ignore:end */

  }

});

var AddressBar = React.createClass({

  onAddressChange: function (evt) {
    var rawAddress = this.refs.address.getDOMNode().value;
    this.onInputChange(splitAddress(rawAddress));
  },

  onInputChange: function (newInput) {
    this.props.setInput(newInput);
  },

  address: function () {
    var input = this.props.address;
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

  validate: function () {
    var input = this.props.address;
    if (!input.houseNumber) {
      return "Missing house number.";
    } else if (!input.street) {
      return "Missing street name.";
    } else if (!input.borough) {
      return "Missing borough.";
    }
  },

  submit: function () {
    var self = this;
    geoclient('address')(this.props.address).done(function (resp) {
      search(resp.bblBoroughCode,
             resp.bblTaxBlock,
             resp.bblTaxLot).done(function (data) {
        self.props.setData(data);
      });
    });
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
      </div>
    );
    /* jshint ignore:end */
  }

});


var search = function (borough, block, lot) {
  var dataUrl = "https://data.cityofnewyork.us/resource/",
      legalsResource = "8h5j-fqxa",
      masterResource = "bnx9-e6tj",
      partiesResource = "636b-3b5g",
      appToken = ".json?$$app_token=UlQ1WIMp3NyhVF2Km0zveytPV",
      $dfd = new $.Deferred();

  // Obtain property JSON
  $.ajax({
    url: dataUrl + legalsResource + appToken + "&$where=borough=" +
      borough + "%20and%20block=" + block + "%20and%20lot=" + lot
    //jsonp: "$jsonp",
    //dataType: "jsonp"
  }).done(function(data) {
    //Array.prototype.push.apply(rows, data);

    var where = [];
    var i = 0;
    for (i = 0; i < data.length; i++) {
      where.push("document_id='" + data[i].document_id + "'");
    }

    where = where.join(' OR ');

    var master = $.ajax({
      url: dataUrl + masterResource + appToken + "&$where=" + where
      //jsonp: "$jsonp",
      //dataType: "jsonp"
    });

    var parties = $.ajax({
      url: dataUrl + partiesResource + appToken + "&$where=" + where
      //jsonp: "$jsonp",
      //dataType: "jsonp"
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
      $dfd.resolve(data);
    });
  });
  return $dfd.promise();
};

$(document).ready(function () {
  /*jshint ignore:start*/
  React.render(
    <App />,
    document.getElementById('app')
  );
  /*jshint ignore:end*/
});

}());

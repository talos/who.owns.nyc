/** @jsx React.DOM */
/*jslint plusplus:true, camelcase:false, strict:false, browser:true,
 maxstatements:40, maxdepth:10*/
/*globals $, React, History*/

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
  rawAddress = rawAddress || '';
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
  mixins: [ReactRouter.State, ReactRouter.Navigation],

  getInitialState: function () {
    var state = {
      data: [],
      input: this.props.input
    };
    return state;
  },

  setData: function (newData) {
    //this.clearInput();
    this.setState({data: newData});
  },

  setInput: function (newInput) {
    var obj = { input: this.state.input };
    $.extend(obj.input, newInput);
    this.setState(obj);
  },

  submit: function () {
    this.transitionTo(this.props.mode, this.state.input);
  },

  render: function () {
    return (
      <div>
      <NavBar ref='navbar'
              submit={this.submit}
              setData={this.setData}
              mode={this.props.mode}
              input={this.state.input}
              setInput={this.setInput} />
        <Results data={this.state.data} />
      </div>
    );
  }

});

var Results = React.createClass({

  render: function () {

    return (
      <Reactable.Table className="table" data={this.props.data}
             defaultSort={'recorded_datetime'}
             sortable={[ 'recorded_datetime', 'document_date']}
             columns={["doc_type", "document_date", "document_amt", "party1.name", "party1.addr1", "party1.addr2", "party1.state", "party1.city", "party1.country", "party1.zip", "party2.name", "party2.addr1", "party2.addr2", "party2.city", "party2.country", "party2.zip"]}
             filterable={["doc_type"]}>
      </Reactable.Table>
    );

  }

});

var NavBar = React.createClass({

  onSubmit: function (evt) {
    evt.preventDefault();
    if (typeof this.refs.inputbar._renderedComponent.validate() === 'undefined') {
      this.props.submit();
    }
  },

  render: function () {
    var mode = this.props.mode;
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
                  <ReactRouter.Link to='address' params={this.props.input}>Address</ReactRouter.Link>
                </li>
                <li className={mode == 'owner' ? 'active': ''}>
                  <ReactRouter.Link to='owner' params={this.props.input}>Owner</ReactRouter.Link>
                </li>
                <li className={mode == 'bbl' ? 'active': ''}>
                  <ReactRouter.Link to='bbl' params={this.props.input}>BBL</ReactRouter.Link>
                </li>
                <ReactRouter.RouteHandler
                      ref='inputbar'
                      input={this.props.input}
                      setData={this.props.setData}
                      setInput={this.props.setInput} />
                <li>
                  <button type="submit" id="submit">Submit</button>
                </li>
              </ul>
            </div>
          </form>
        </div>
      </nav>
    );
  }
});

var OwnerBar = React.createClass({

  render: function () {

    return (
      <div>
        owner
      </div>
    );

  }

});

var BBLBar = React.createClass({

  validateBlock: function () {
    var block = this.props.input.block;
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
    var lot = this.props.input.lot;
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

  validate: function() {
    var lotValid = this.validateLot(),
        blockValid = this.validateBlock();

    if (typeof lotValid !== 'undefined') {
      return lotValid;
    } else if (typeof blockValid !== 'undefined') {
      return blockValid;
    }
  },

  onChange: function (evt) {
    var $target = $(evt.target),
        name = $target.attr('name'),
        val = $target.val();
    var obj = this.props.input;
    obj[name] = val;
    this.props.setInput(obj);
  },

  render: function () {
    return (
      <div>
        <select name="borough"
               className="form-control"
               ref="borough"
               value={this.props.input.borough}
               onChange={this.onChange}>
          <option value="">Select a borough</option>
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
                 ref="block"
                 placeholder="Block"
                 value={this.props.input.block}
                 onChange={this.onChange} />
        </div>
        <div className="hint--bottom"
             data-hint={this.validateLot()}>
          <input name="lot"
                 className="form-control"
                 ref="lot"
                 placeholder="Lot"
                 value={this.props.input.lot}
                 onChange={this.onChange} />
        </div>
      </div>
    );
  }

});

var AddressBar = React.createClass({

  componentWillMount: function () {
    var self = this;
    if (typeof this.validate() === 'undefined') {
      var split = splitAddress(this.props.input.address);
      geoclient('address')(split).done(function (resp) {
        search(resp.bblBoroughCode,
               resp.bblTaxBlock,
               resp.bblTaxLot).done(function (data) {
          self.props.setData(data);
        });
      });
    }
  },

  onAddressChange: function (evt) {
    var rawAddress = this.refs.address.getDOMNode().value;
    this.props.setInput({address: rawAddress});
  },

  /*address: function () {
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
  },*/

  validate: function () {
    //var input = this.props.input;
    var split = splitAddress(this.props.input.address);
    if (!split.houseNumber) {
      return "Missing house number.";
    } else if (!split.street) {
      return "Missing street name.";
    } else if (!split.borough) {
      return "Missing borough.";
    }
  },

  /*submit: function () {
    },*/

  render: function () {
    return (
      <div className="hint--bottom"
           data-hint={this.validate()}>
        <input name="address"
               className="form-control"
               ref="address"
               placeholder="Address"
               value={this.props.input.address}
               onChange={this.onAddressChange} />
      </div>
    );
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

var NotFound = React.createClass({

  render: function () {
    return (
      <div>Not found</div>
    );
  }
});

$(document).ready(function () {
  var routes = (
    <ReactRouter.Route name="index" path="/" handler={App}>
      <ReactRouter.Route name="address" path="address/?:address?" handler={AddressBar} />
      <ReactRouter.Route name="owner" path="owner/?:owner?" handler={OwnerBar} />
      <ReactRouter.Route name="bbl" path="bbl/?:borough?/?:block?/?:lot?" handler={BBLBar} />
      <ReactRouter.NotFoundRoute handler={NotFound} />
    </ReactRouter.Route>
  );

  ReactRouter.run(routes, ReactRouter.HistoryLocation, function (Handler, state) {
    var activeRoute = state.routes[1],
        mode,
        input;

    if (activeRoute) {
      mode = activeRoute.name;
      input = state.params;
    }
    React.render(<Handler mode={mode} input={input} />, document.body);
  });
});

// $(document).ready(function () {
//   History.Adapter.bind(window, 'statechange', function () {
//     var State = History.getState();
//   });
//   React.render(
//     <App />,
//     document.getElementById('app')
//   );
// });

}());

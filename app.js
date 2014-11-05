$.ajax({
    url: "http://data.acgov.org/resource/k9se-aps6.json?city=Alameda",
    jsonp: "$jsonp",
    dataType: "jsonp"
}).done(function(data) {
    console.log("Request received: " + data);
});

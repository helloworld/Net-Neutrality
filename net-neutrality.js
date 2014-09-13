if (Meteor.isClient) {

    Template.contactInfo.events({
        'click #submitContactInfo': function() {
            firstName = $("#firstName").val();
            lastName = $("#lastName").val();
            streetAddress = $("#streetAddress").val();
            zipCode = $("#zipCode").val();

            var contact = {};
            contact["firstName"] = firstName;
            contact["lastName"] = lastName;
            contact["streetAddress"] = streetAddress;
            contact["zipCode"] = zipCode;


            Meteor.call('convertStreetAddress', streetAddress, function(e, r) {
                locationObject = r;
                Meteor.call('fetchDistrictsFromService', locationObject, function(e, r) {
                    districtObject = r;
                    console.log(districtObject);
                    contact["legislatorInfo"] = districtObject;
                    Session.setDefault("contactInfo", contact);
                });
            });
        }
    });
}

if (Meteor.isServer) {
    Meteor.methods({
        convertStreetAddress: function(streetAddress) {
            var GOOGLEAPIKEY = "YOUR API KEY";
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + streetAddress + "&key=" + GOOGLEAPIKEY;
            //synchronous GET
            var result = HTTP.call("GET", url);

            toEval = "var x=" + result.content;
            eval(toEval);
            return x.results[0].geometry.location;

        },
        fetchDistrictsFromService: function(locationObject) {
            var CONGRESSAPIKEY = "YOUR API KEY";
            var url = "https://congress.api.sunlightfoundation.com/legislators/locate?latitude=" + locationObject.lat + "&longitude=" + locationObject.lng + "&apikey=" + CONGRESSAPIKEY;
            //synchronous GET
            var result = HTTP.call("GET", url);

            toEval = "var x=" + result.content;
            eval(toEval);
            console.log(x, x.results, x.count);
            return [x.results, x.count];
        }
    });
}

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
    });
}

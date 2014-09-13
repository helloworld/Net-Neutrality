if (Meteor.isClient) {

    Deps.autorun(function() {
        if (Session.get("contactInfo") != undefined) {
            contact = Session.get("contactInfo");
            $("#firstName").val(contact["firstName"]);
            $("#lastName").val(contact["lastName"]);
            $("#streetAddress").val(contact["streetAddress"]);
            $("#zipCode").val(contact["zipCode"]);
        };
    });


    Template.contactInfo.events({
        'click #submitContactInfo': function() {
            // firstName = $("#firstName").val();
            // lastName = $("#lastName").val();
            // streetAddress = $("#streetAddress").val();
            // zipCode = $("#zipCode").val();

            firstName = "sad"
            lastName = "sdf"
            streetAddress = "13141 Rose Petal Cir"
            zipCode = "20171"


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
                    Session.set("contactInfo", contact);
                });
            });
        }
    });

    Template.legislatorInfo.helpers({
        contactInfoSet: function() {
            return Session.get("contactInfo") != undefined;
        },
        legislator: function() {
            return Session.get("contactInfo").legislatorInfo[0];
        }
    });

    Template.legislatorInfo.rendered = function() {
        ! function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (!d.getElementById(id)) {
                js = d.createElement(s);
                js.id = id;
                js.src = "//platform.twitter.com/widgets.js";
                fjs.parentNode.insertBefore(js, fjs);
            }
        }(document, "script", "twitter-wjs");
    }


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

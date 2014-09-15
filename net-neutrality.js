Advocates = new Meteor.Collection('advocates');

if (Meteor.isClient) {

    advocatesSub = Meteor.subscribe('advocates');

    Router.configure({
        layoutTemplate: 'layout',
    });

    Router.map(function() {
        this.route('home', {
            path: '/'
        });
    });

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
            firstName = $("#firstName").val();
            lastName = $("#lastName").val();
            streetAddress = $("#streetAddress").val();
            zipCode = $("#zipCode").val();
            phoneNumber = $("#phoneNumber").val();



            var contact = {};
            contact["firstName"] = firstName;
            contact["lastName"] = lastName;
            contact["streetAddress"] = streetAddress;
            contact["zipCode"] = zipCode;
            contact["phoneNumber"] = phoneNumber;


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

    Template.legislatorInfo.events({
        'click #placeCall': function(event) {
            var domEl = event.currentTarget;
            var phone = $(domEl).attr("data-phoneNumber");
            var firstName = $(domEl).attr("data-firstName");
            var lastName = $(domEl).attr("data-lastName");
            var state = $(domEl).attr("data-state");
            var chamber = $(domEl).attr("data-chamber");
            var user = Session.get("contactInfo")

            $(domEl).prop('disabled', true);

            Meteor.call("placeCall", phone, firstName, lastName, state, chamber, user, function(e, r) {
                console.log(r);
            });

            alert("Call being placed. Check your phone!");
        },
        'click #email': function(event) {
            var domEl = event.currentTarget;
            var email = $(domEl).attr("data-email");
            var firstName = $(domEl).attr("data-firstName");
            var lastName = $(domEl).attr("data-lastName");
            var user = Session.get("contactInfo")
            var message = "I am concerned about Net Neutrality";

            Meteor.call("sendEmail", email, firstName, lastName, user, message, function(e, r) {
                console.log(r);
            });

            alert("Email Sent!");
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

    Meteor.startup(function() {
        process.env.MAIL_URL = 'smtp://userName:passWord@smtp.sendgrid.net:587';
    });

    Meteor.publish('advocates', function() {
        return Advocates.find({}, {
            sort: {
                created_at: 1
            }
        });
    });

    Router.map(function() {
        this.route('placeCallXML', {
            where: 'server',
            path: '/legislators/:phoneNumber/:chamber/:firstName/:lastName/:state',

            action: function() {
                var phoneNumber = this.params.phoneNumber;
                var chamber = this.params.chamber;
                var firstName = this.params.firstName;
                var lastName = this.params.lastName;
                var state = this.params.state;

                this.response.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                this.response.end("<Response><Say>Thank you for advocating for Net Neutrality. You are about to be connected to your " + chamber + " representative " + firstName + " " + lastName + " from the State of " + state + ".</Say><Dial>" + phoneNumber + "</Dial></Response>");
            }
        });
    });

    Meteor.methods({
        convertStreetAddress: function(streetAddress) {
            var GOOGLEAPIKEY = "KEY";
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + streetAddress + "&key=" + GOOGLEAPIKEY;
            //synchronous GET
            var result = HTTP.call("GET", url);

            toEval = "var x=" + result.content;
            eval(toEval);
            return x.results[0].geometry.location;

        },
        fetchDistrictsFromService: function(locationObject) {
            var CONGRESSAPIKEY = "KEY";
            var url = "https://congress.api.sunlightfoundation.com/legislators/locate?latitude=" + locationObject.lat + "&longitude=" + locationObject.lng + "&apikey=" + CONGRESSAPIKEY;
            //synchronous GET
            var result = HTTP.call("GET", url);

            toEval = "var x=" + result.content;
            eval(toEval);
            console.log(x, x.results, x.count);
            return [x.results, x.count];
        },
        sendMessage: function() {
            ACCOUNT_SID = "KEY";
            AUTH_TOKEN = "KEY";

            var result = Meteor.http.post('https://api.twilio.com/2010-04-01/Accounts/' + ACCOUNT_SID + '/Messages/', {
                params: {
                    From: "2027602988",
                    To: "7034624169",
                    Body: "Helloworld"
                },
                auth: ACCOUNT_SID + ":" + AUTH_TOKEN
            });

            return result;
        },

        placeCall: function(phone, firstName, lastName, state, chamber, user) {
            ACCOUNT_SID = "KEY";
            AUTH_TOKEN = "KEY";

            console.log("PHONELKJS DLKFJ " + phone);

            console.log("neutral.meteor.com/legislators/" + phone + "/" + chamber + "/" + firstName + "/" + lastName + "/" + state);

            var result = Meteor.http.post('https://api.twilio.com/2010-04-01/Accounts/' + ACCOUNT_SID + '/Calls/', {
                params: {
                    From: "2027602988",
                    To: user.phoneNumber,
                    Url: "http://neutral.meteor.com/legislators/" + phone + "/" + chamber + "/" + firstName + "/" + lastName + "/" + state
                },
                auth: ACCOUNT_SID + ":" + AUTH_TOKEN

            }, function(e, r) {
                console.log(e, r);
            });

            console.log("end")

            return result;
        },
        sendEmail: function(email, firstName, lastName, user, message) {
            Email.send({
                from: user.firstName + "@neutral.meteor.com",
                to: email,
                subject: "Maintain Net Neutrality",
                text: message
            });

        }
    });
}

var fs = require('fs');
var fx = require('./fx');
var Stripe = require('stripe');

module.exports = function(wagner) {
    var stripe =

        // TODO: Make Stripe depend on the Config service and use its `stripeKey`
        // property to get the Stripe API key.
        wagner.factory('Stripe', function() {
            // return Stripe(process.env.STRIPE_API_KEY);
            return Stripe("sk_test_ZPTLcTtpDPvz3ZNkLt707GU4");
        });

    wagner.factory('fx', fx);

    //幫config註冊為service
    wagner.factory('Config', function() {
        return JSON.parse(fs.readFileSync('./config.json').toString());
    });
};

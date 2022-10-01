require('dotenv').config({ path: 'config/env/.env'});
/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // sendgridSecret: 'SG.fake.3e0Bn0qSQVnwb1E4qNPz9JZP5vLZYqjh7sn8S93oSHU',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …
  SELLING_PARTNER_APP_CLIENT_ID: process.env.SELLING_PARTNER_APP_CLIENT_ID,
  SELLING_PARTNER_APP_CLIENT_SECRET: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_SELLING_PARTNER_ROLE: process.env.AWS_SELLING_PARTNER_ROLE,
  REFRESHTOKEN: process.env.REFRESHTOKEN,
  WC_CONSUMER_KEY: process.env.WC_CONSUMER_KEY,
  WC_CONSUMER_SECRET: process.env.WC_CONSUMER_SECRET,

};

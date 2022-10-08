const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

class Woocommerce {

  constructor(url = 'http://localhost:8081/wordpress/') {
    this.urlShop = url;
    this.api = null;
  }

  async connect() {
    return new Promise(async (resolve, reject) => {
      try{
        this.api = new WooCommerceRestApi({
          url: this.url,
          consumerKey: sails.config.custom.WC_CONSUMER_KEY,
          consumerSecret: sails.config.custom.WC_CONSUMER_SECRET,
          version: 'wc/v3',
        });
      } catch(e){
        reject(`Error al intentar conectar con Woocommerce, error al crear el objeto.${JSON.stringify(e)}`);
      }

      if (this.api !== null) {
        resolve(`Conexión con Woocommerce a ${this.url}`)
      } else {
        reject('Error al intentar conectar con Woocommerce');
      }
    });
  }

}

module.exports = Woocommerce;
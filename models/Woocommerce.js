require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

class Woocommerce {

  constructor(url = 'http://localhost:8081/wordpress/') {
    this.urlShop = url;
    this.api = null;
  }

  async connect() {
    return new Promise(async (resolve, reject) => {
      try {
        this.api = new WooCommerceRestApi({
          url: this.urlShop,
          consumerKey: process.env.WC_CONSUMER_KEY,
          consumerSecret: process.env.WC_CONSUMER_SECRET,
          version: 'wc/v3',
        });
      } catch (e) {
        reject(`Error al intentar conectar con Woocommerce, error al crear el objeto.${JSON.stringify(e)}`);
      }

      if (this.api !== null) {
        resolve(`Conexión con Woocommerce a ${this.url}`)
      } else {
        reject('Error al intentar conectar con Woocommerce');
      }
    });
  }

  /**
   * 
   * @package sellercontrol
   * @version 2022.10.09
   * @author Gerardo Gonzalez
   * 
   * @param {Object} param JSON object with search parameters
   * @returns {Object} JSON object with the response information from the server
   * 
   * @see http://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#list-all-products
   * 
   */
  async getProducts(param = {
    page: 1,
    per_page: 20, // 20 products per page
    order: "desc",
    orderby: "date",
  }) {
    return new Promise(async (resolve, reject) => {
      this.api.get("products", param)
        .then((response) => {
          // Successful request
          console.log("Response Status:", response.status);
          console.log("Response Headers:", response.headers);
          console.log("Response Data:", response.data);
          console.log("Total of pages:", response.headers['x-wp-totalpages']);
          console.log("Total of items:", response.headers['x-wp-total']);
        })
        .catch((error) => {
          // Invalid request, for 4xx and 5xx statuses
          console.log("Response Status:", error.response.status);
          console.log("Response Headers:", error.response.headers);
          console.log("Response Data:", error.response.data);
        })
        .finally(() => {
          // Always executed.
          resolve();
        });
    })
  }

  /**
   * 
   * @package sellercontrol
   * @version 2022.10.09
   * @author Gerardo Gonzalez
   * 
   * @param {Array[Object]} param 
   * @returns {Object}
   * 
   * @see http://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#batch-update-products
   * 
   */
  async createProduct(param = []) {
    return new Promise(async (resolve, reject) => {
      let data = {
        create: param
      }

      batch(data)
        .then((response) => resolve())
        .catch((error) => reject())

    });
  }

  /**
 * 
 * @package sellercontrol
 * @version 2022.10.09
 * @author Gerardo Gonzalez
 * 
 * @param {Array[Object]} param 
 * @returns {Object}
 * 
 * @see http://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#batch-update-products
 * 
 */
  async updateProduct(param = []) {
    return new Promise(async (resolve, reject) => {
      let data = {
        update: param
      }

      batch(data)
        .then((response) => resolve())
        .catch((error) => reject())

    });
  }

  /**
   * 
   * @package sellercontrol
   * @version 2022.10.09
   * @author Gerardo Gonzalez
   * 
   * @param {Array[int]} param 
   * @returns {Object}
   * 
   * @see http://woocommerce.github.io/woocommerce-rest-api-docs/?javascript#batch-update-products
   * 
   */
  async deleteProduct(param = []) {
    return new Promise(async (resolve, reject) => {
      let data = {
        delete: param
      }

      batch(data)
        .then((response) => resolve())
        .catch((error) => reject());
    });
  }

  /**
   * 
   * @param {*} data 
   * @returns 
   * 
   * @private
   * 
   */
  async batch(data) {

    return new Promise((resolve, reject) => {

      this.api.post("products/batch", data)
        .then((response) => {
          // Successful request
          console.log("Response Status:", response.status);
          console.log("Response Headers:", response.headers);
          console.log("Response Data:", response.data);
          console.log("Total of pages:", response.headers['x-wp-totalpages']);
          console.log("Total of items:", response.headers['x-wp-total']);

          resolve(response.data);

        })
        .catch((error) => {
          // Invalid request, for 4xx and 5xx statuses
          console.log("Response Status:", error.response.status);
          console.log("Response Headers:", error.response.headers);
          console.log("Response Data:", error.response.data);

          reject(error.response.data);

        });

    });

  }

}

module.exports = Woocommerce;
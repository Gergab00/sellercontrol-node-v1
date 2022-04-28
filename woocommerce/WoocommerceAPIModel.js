require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const flattie = require('flattie');

class WoocommerceAPIModel {

    api;
    url;

    constructor(url = "http://localhost:8081/wordpress/") {
        this.url = url;
    }

    async connect() {
        return new Promise(async (resolve, reject) => {
            this.api = new WooCommerceRestApi({
                url: this.url,
                consumerKey: process.env.WC_CONSUMER_KEY,
                consumerSecret: process.env.WC_CONSUMER_SECRET,
                version: "wc/v3",
            });

            if (this.api != null) {
                resolve(`Conexión con Woocommerce a ${this.url}`)
            } else {
                reject('Error al intentar conectar con Woocommerce')
            }
        });

    }

    async createProduct(dataProduct, api = this.api) {
        return new Promise(async (resolve, reject) => {
            //console.log('dataProduct: ',dataProduct)
            api.post("products", dataProduct)
                .then(async (res) => {
                    resolve(res)
                })
                .catch(async (error) => {
                    console.log("Response Status:", error.response.status);
                    console.log("Response Headers:", error.response.headers);
                    console.log("Response Data:", error.response.data);
                    reject(error.response.data)
                });
        });
    }

    /**
     * @version 2022.04.28
     * @description Función que actualiza los productos de woocommerce en función de los parametros enviados.
     * @param int Se pasa el id del proucto a actualizar.
     * @param Object Se pasa un objeto con clave valor de los campos a actualizar ej { price:100, stock:  5}
     * @returns Promise<Response> Se devuelve la respuesta del servidor.
     */
    async updateProduct(id, data, api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.put(`products/${id}`, data)
                .then(async (res) => {
                    // Successful request
                    //console.log("Response updateProduct Status:", res.status);
                    //console.log("Response updateProduct Headers:", res.headers);
                    //console.log("Response updateProduct Data:", res.data);
                    resolve(res)
                })
                .catch(async (error) => {
                    //console.log("Response error putProducts Status:", error.response.status);
                    //console.log("Response error putProducts Headers:", error.response.headers);
                    //console.log("Response error putProducts Data:", error.response.data);
                    reject(error.response.data)
                });
        });
    }

    async existsProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
            let ret;
            api.get("products", {
                    sku: sku
                })
                .then((response) => {
                    // Successful requess
                    if (1 === response.data.length) {
                        ret = false;
                    } else {
                        ret = true;
                    } //Si existe el producto regresa true, si no existe regresa false
                    console.log(`Resultado para ${sku} de existsProducts: ${!ret}`);
                   // console.log("Response: ", flattie.flattie(response, '.', true))
                    resolve(ret);
                }).catch((error) => {
                    // Invalid request, for 4xx and 5xx statuses
                    console.log("Response Error:", error);
                    //reject(`Response Error: ${error.response.data}`)
                    reject(`Response Error: ${error.response}`)
                });
        });
    }

    async getProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.get("products", {
                    sku: sku
                })
                .then((response) => {
                    // Successful requess
                    //console.log('Resultado de WoocommerceAPIModel.getProduct', response.data[0]);
                    if(response.data[0] === undefined) reject('El objeto no existe.');
                    if(response.data[0].length === 0) reject('El objeto no existe.');
                    resolve(response.data[0]);
                })
                .catch(async (error) => {
                    reject("Error en WoocommerceAPIModel.getProduct: " + error.response)
                });
        });
    }


    /**
     * @version 2022.04.26
     * @author Gerardo Gonzalez
     * @param {string} type Limit result set to products assigned a specific type. Options: simple, grouped, external and variable. Default is simple
     * @param {number} page Current page of the collection. Default is 1
     * @param {object} api The API object og WoocommerceAPIModel
     * @returns Promise
     */
    async getInventorySummaries(type = "simple", page = 1, api = this.api) {
        return new Promise(async (resolve, reject) => {
            let inventory = []
            api.get("products", {
                    page: page,
                    per_page: 100,
                    type: type
                })
                .then(async (res) => {
                    resolve(res.data)
                })
                .catch(async (error) => {
                    reject(error.response.data)
                });
        });
    }

    /**
     * @version 2022.04.27
     */
    async getCategoryID(name, api = this.api){

    }

    /**
     * @version 2022.04.27
     */
    async setCategory(name, api = this.api){

    }

    async getTotalProducts(api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.get("reports/products/totals")
                .then((response) => {
                    //console.log(response.data);
                    resolve(response.data);
                })
                .catch(async (error) => {
                    reject(error.response.data)
                });
        });
    }

    async batchProducts(data, api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.post("products/batch", data)
                .then((response) => {
                    //console.log(response.data);
                    console.log('Productos Woocommerce actualizados correctamente.')
                    resolve(response.data)
                })
                .catch((error) => {
                    //console.log(error.response.data);
                    reject(error.response.data)
                });
        });
    }
}

module.exports = WoocommerceAPIModel;
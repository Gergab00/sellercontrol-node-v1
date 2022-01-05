require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

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
                version: "wc/v3"
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
            console.log('dataProduct: ',dataProduct)
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
     * @description Función que actualiza los productos de woocommerce en función de los parametros enviados.
     * @param int Se pasa el id del proucto a actualizar.
     * @param Object Se pasa un objeto con clave valor de los campos a actualizar ej { price:100, stock:  5}
     * @returns Promise<Response> Se devuelve la respuesta del servidor.
     */
    async updateProduct(id, data, api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.put(`products/${id}`, data)
                .then(async (res) => {
                    //console.log("Response putProducts: ",res);
                    resolve(res)
                })
                .catch(async (error) => {
                    //console.log("Response putProducts Status:", error.response.status);
                    //console.log("Response putProducts Headers:", error.response.headers);
                    console.log("Response putProducts Data:", error.response.data);
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
                    console.log(`Resultado de existsProducts ${ret}`)
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
                    resolve(response.data[0]);
                })
                .catch(async (error) => {
                    reject(error.response)
                });
        });
    }


    async getInventorySummaries(page = 1, api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.get("products", {
                    page: page,
                    per_page: 100
                })
                .then(async (res) => {
                    resolve(res.data)
                })
                .catch(async (error) => {
                    reject(error.response.data)
                });
        });
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
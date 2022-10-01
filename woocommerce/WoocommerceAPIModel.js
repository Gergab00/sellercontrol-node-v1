require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const flattie = require('flattie');
const { debug } = require('request');

class WoocommerceAPIModel {

    api;
    url;
    debug = false;

    constructor(url = "http://localhost:8081/wordpress/") {
        this.url = url;
    }

    async connect() {
        return new Promise(async (resolve, reject) => {
            try{
            this.api = new WooCommerceRestApi({
                url: this.url,
                consumerKey: process.env.WC_CONSUMER_KEY,
                consumerSecret: process.env.WC_CONSUMER_SECRET,
                version: "wc/v3",
            });
            } catch(e){
                reject(`Error al intentar conectar con Woocommerce, error al crear el objeto.${JSON. stringify(e)}`)
            }

            if (this.api != null) {
                resolve(`Conexión con Woocommerce a ${this.url}`)
            } else {
                reject('Error al intentar conectar con Woocommerce')
            }
        });

    }

    async setDebug(boolean){
        this.debug = boolean;
    }

    get debug(){
        return this.debug;
    }

    async createProduct(dataProduct, api = this.api) {
        return new Promise(async (resolve, reject) => {
            //console.log('dataProduct: ',dataProduct)
            api.post("products", dataProduct)
                .then(async (res) => {
                    resolve(res)
                })
                .catch((error) => {
                    if (typeof error === 'undefined')console.log("Data es undefined.")
                    // Invalid request, for 4xx and 5xx statuses
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        if(this.debug)console.log("Error en WoocommerceAPIModel.updateProduct: " + error.response);
                        //console.log(error.response.status);
                        //console.log(error.response.headers);
                        reject(error.response.data)
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        if(this.debug) console.log(error.request);
                        reject(error.request)
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        if(this.debug) console.log('Error', error.message);
                        reject(error.message)
                    }
                    if(this.debug) console.log(error.config);
                    reject(error.config)
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
                    if(this.debug) console.log("Response updateProduct Data:", res.data);
                    resolve(res)
                })
                .catch((error) => {
                    if (typeof error === 'undefined')console.log("Data es undefined.")
                    // Invalid request, for 4xx and 5xx statuses
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        if(this.debug) console.log("Error en WoocommerceAPIModel.updateProduct: " + error.response);
                        //console.log(error.response.status);
                        //console.log(error.response.headers);
                        reject(error.response.data)
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        if(this.debug) console.log(error.request);
                        reject(error.request)
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        if(this.debug) console.log('Error', error.message);
                        reject(error.message)
                    }
                    if(this.debug) console.log(error.config);
                    reject(error.config)
                  });
        });
    }

    async existsProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
            let ret;
            console.log('Ejecutando WooAPIModel.existsProduct ASIN: ', sku);
            api.get("products", {
                    sku: sku
                })
                .then((response) => {
                    // Successful requess                
                    //console.log("Response Status:", response.status);
                    //console.log("Response Headers:", response.headers);
                    console.log("Response Data:", response.data);
                    
                    if (1 === response.data.length) {
                        ret = false;
                    } else {
                        ret = true;
                    } //Si existe el producto regresa true, si no existe regresa false
                    console.log(`Resultado para ${sku} de existsProducts: ${!ret}`);
                    //console.log("Response: ", response.data);
                    resolve(ret);
                }).catch((error) => {
                    // Invalid request, for 4xx and 5xx statuses
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        if(this.debug) console.log("Error en WoocommerceAPIModel.existsProduct: " + error.response);
                        //console.log(error.response.status);
                        //console.log(error.response.headers);
                        reject(error.response.data)
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        if(this.debug) console.log(error.request);
                        reject(error.request)
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        if(this.debug) console.log('Error', error.message);
                        reject(error.message)
                    }
                    if(this.debug) console.log(error.config);
                    reject(error.config)
                  });
        });
    }

    /**
     * @version 2022.05.15
     * @param {number} sku El sku del producto a obtener
     * @param {object} api La api conectada de Woocommerce
     * @returns 
     */
    async getProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
            api.get("products", {
                    sku: sku
                })
                .then((response) => {
                    // Successful requess
                    //if(this.debug)
                    console.log('Resultado de WoocommerceAPIModel.getProduct', response.data);
                    if(typeof response.data[0] === 'undefined') reject('El objeto no existe.');
                    if(response.data.length === 0) reject('El objeto no existe.');
                    resolve(response.data[0]);
                })
                .catch((error) => {
                    // Invalid request, for 4xx and 5xx statuses
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        if(this.debug) console.log("Error en WoocommerceAPIModel.getProduct: " + error.response);
                        console.log("Error en WoocommerceAPIModel.getProduct: " + error.response);
                        //console.log(error.response.status);
                        //console.log(error.response.headers);
                        reject(error.response.data)
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        if(this.debug) console.log(error.request);
                        reject(error.request)
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        if(this.debug) console.log('Error', error.message);
                        reject(error.message)
                    }
                    if(this.debug) console.log(error.config);
                    reject(error.config)
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
                .catch((error) => {
                    // Invalid request, for 4xx and 5xx statuses
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        if(this.debug) console.log("Error en WoocommerceAPIModel.getInventorySummaries: " + error.response);
                        //console.log(error.response.status);
                        //console.log(error.response.headers);
                        reject(error.response.data)
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        if(this.debug) console.log(error.request);
                        reject(error.request)
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        if(this.debug) console.log('Error', error.message);
                        reject(error.message)
                    }
                    if(this.debug) console.log(error.config);
                    reject(error.config)
                  });
        });
    }

    /**
     * @version 2022.04.27
     */
    async getCategorias(name, page = 1, api = this.api){
        return new Promise(async (resolve, reject) => {
            
            api.get("products/categories", {
                    page: page,
                    per_page: 100,
                    search: name
                })
                .then((response) => {
                    // Successful request
                    // console.log("Response Status:", response.status);
                    // console.log("Response Headers:", response.headers);
                    if(this.debug) console.log("Response Data:", response.data);
                    // console.log("Total of pages:", response.headers['x-wp-totalpages']);
                    // console.log("Total of items:", response.headers['x-wp-total']);
                    resolve(response.data)
                  })
                  .catch((error) => {
                    // Invalid request, for 4xx and 5xx statuses
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        if(this.debug) console.log(error.response);
                        //console.log(error.response.status);
                        //console.log(error.response.headers);
                        reject(error.response.data)
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        if(this.debug)console.log(error.request);
                        reject(error.request)
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        if(this.debug) console.log('Error', error.message);
                        reject(error.message)
                    }
                    if(this.debug) console.log(error.config);
                    reject(error.config)
                  });
        });

    }

    /**
     * @version 2022.04.27
     */
    async setCategory(name,img, parent_id, api = this.api){
        return new Promise(async (resolve, reject) => {

            const data = {
                name: name,
                parent: parent_id,                
              };

              if(img !== null){
                  data['image'] ={src:img}
              }

            api.post("products/categories", data)
            .then((response) => {
                // Successful request
                // console.log("Response Status:", response.status);
                // console.log("Response Headers:", response.headers);
                if(this.debug) console.log("Response Data:", response.data);
                // console.log("Total of pages:", response.headers['x-wp-totalpages']);
                // console.log("Total of items:", response.headers['x-wp-total']);
                resolve(response.data)
              })
              .catch((error) => {
                // Invalid request, for 4xx and 5xx statuses
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    if(this.debug) console.log(error.response.data);
                    console.log(error.response.data);
                    //console.log(error.response.status);
                    //console.log(error.response.headers);
                    reject(error.response.data)
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    if(this.debug) console.log(error.request);
                    reject(error.request)
                } else {
                    // Something happened in setting up the request that triggered an Error
                    if(this.debug) console.log('Error', error.message);
                    reject(error.message)
                }
                if(this.debug) console.log(error.config);
                reject(error.config)
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
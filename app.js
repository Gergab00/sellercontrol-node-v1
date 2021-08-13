const AmazonAPIModel = require('./amazon/AmazonAPIModel.js');

(async() => {

let asin = 'B01ASVCZBC';
let report_id = "51394018836";
let reportDocumentId = "";
let report_document = null;
const amz = new AmazonAPIModel();
await amz.connect(amz.REFRESHTOKEN);
 await amz.getAsinData(asin)
.then(async(res)=>{
    console.log("Respuesta: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getEAN()
.then(async(res)=>{
    console.log("Ean: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getBrandName()
.then(async(res)=>{
    console.log("Brand: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getCategory(asin)
.then(async(res)=>{
    console.log("Category: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getManufacturer()
.then(async(res)=>{
    console.log("Manufacturer: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getItemName()
.then(async(res)=>{
    console.log("itemName: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getModelNumber()
.then(async(res)=>{
    console.log("modelNumber: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getPricing(asin)
.then(async(res)=>{
    console.log("Buying Price: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getCompetitivePricing(asin)
.then(async(res)=>{
    console.log("CompetitivePricing: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getItemOffers(asin)
.then(async(res)=>{
    console.log("ItemOffers: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

/*await amz.getInventorySummaries()
.then(async(res)=>{
    console.log("getInventorySummaries: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.createReport()
.then(async(res)=>{
    console.log("createReport: ", res);
    report_id = res;
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getReport(report_id)
.then(async(res)=>{
    console.log("getReport: ", res);
    reportDocumentId = res.reportDocumentId;
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getReportDocument(reportDocumentId)
.then(async(res)=>{
    console.log("getReportDocument: ", res);
    report_document = res;
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.downloadDocument(report_document)
.then(async(res)=>{
    console.log("downloadDocument: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});

await amz.getQuantities()
.then(async(res)=>{
    console.log("getQuantities: ", res);
})
.catch(async(error)=>{
    console.log("Error: ", error);
});*/

})();
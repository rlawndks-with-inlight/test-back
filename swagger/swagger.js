const swaggerUi = require('swagger-ui-express');
const swaggereJsdoc = require('swagger-jsdoc');

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";
const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "연습용 API",
      version: "1.0.0",
      description: "ajax 연습을 위한 api",
    },
    basePath: "/",
  },
  apis: ["./routes/*.js" ],
  
};
const specs = swaggereJsdoc(options);
swaggerUi.setup(specs, { customCssUrl: CSS_URL })

module.exports = {
    swaggerUi, specs 
};
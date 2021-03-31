const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Vaildation Middleware

// checks if id === :dishId
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`,
      });
}

//id in the body does not match :dishId in the route
function checkDishId(req, res, next) {
    const dishId = req.params.dishId;
    const {data: {id} } = req.body
    if (
      id !== dishId &&
      id !== null &&
      id !== undefined &&
      id !== ""
      ) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${dishId}`,
      });
    }
    return next();
  }

// checks the BODY to ensure every key and value is valid
function bodyIsValid(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    if (!name || name === "") {
        next({
            status: 400,
            message: "Dish must include a name",
        });
    } else if (!description || description === "") {
        next({
            status: 400,
            message: "Dish must include a description",
        });
    } else if (!price) {
        next({
            status: 400,
            message: "Dish must include a price",
        });
    } else if (price <= 0 || typeof price !== "number") {
      next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0",
      });
    } else if (!image_url || image_url === "") {
      next({
        status: 400,
        message: "Dish must include a image_url",
      });
    } else {
      return next();
    }
}
  

// GET for /dishes (list)
function list(req, res) {
    res.json( {data: dishes})
}

// POST for /dishes (create)
function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);

    res.status(201).json({data: newDish})

}

//GET for /dishes/:dishId (read)
function read(req, res) {
    const dish = res.locals.dish;
    res.json({data: dish})
}

//PUT for /dishes/:dishId (update)
function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    if (dish.name !== name) {
        dish.name = name
    }
    if (dish.description !== description) {
      dish.description = description
    }
    if (dish.price !== price) {
      dish.price = price
    }
    if (dish.image_url !== image_url) {
      dish.image_url = image_url
    }
  
  res.json( {data: dish})
  
}

module.exports = {
    create: [bodyIsValid, create],
    list,
    read: [dishExists, read],
    update: [dishExists, bodyIsValid, checkDishId, update],
};